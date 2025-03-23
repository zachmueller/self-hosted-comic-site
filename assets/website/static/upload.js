// Utility function to calculate SHA-1 hash of file
async function calculateFileHash(file) {
	const buffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateUUID() {
	// First try the built-in crypto.randomUUID() method
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}

	// Fallback for older browsers
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

async function addPanel() {
	const fileInput = document.getElementById('fileInput');
	const file = fileInput.files[0];
	
	if (!file) {
		alert('Please select a file first');
		return;
	}

	const hash = await calculateFileHash(file);
	const extension = file.name.split('.').pop();
	const filename = `${hash}.${extension}`;

	const container = document.getElementById('panelsContainer');
	const panelNumber = container.children.length + 1;

	// Create panel container
	const panel = document.createElement('div');
	panel.className = 'panel-item';
	panel.dataset.filename = filename;
	panel.file = file; // Store the file reference

	// Create panel content container
	const content = document.createElement('div');
	content.className = 'panel-content';

	// Create panel number display
	const numberDiv = document.createElement('div');
	numberDiv.className = 'panel-number';
	numberDiv.textContent = `Panel ${panelNumber}`;
	content.appendChild(numberDiv);

	// Create image preview
	const img = document.createElement('img');
	img.src = URL.createObjectURL(file);
	img.alt = 'Preview';
	content.appendChild(img);

	// Create alt text input
	const altText = document.createElement('textarea');
	altText.className = 'alt-text-input';
	altText.placeholder = 'Alt text for accessibility (optional)';
	content.appendChild(altText);

	// Create remove button
	const removeButton = document.createElement('button');
	removeButton.type = 'button';
	removeButton.className = 'remove-button';
	removeButton.textContent = 'Remove';
	removeButton.onclick = () => removePanel(removeButton);

	// Assemble panel
	panel.appendChild(content);
	panel.appendChild(removeButton);
	container.appendChild(panel);

	// Clear file input for next panel
	fileInput.value = '';
}

function removePanel(button) {
	const panel = button.closest('.panel-item');
	panel.remove();
	
	// Update panel numbers
	const panels = document.querySelectorAll('.panel-item');
	panels.forEach((panel, index) => {
		panel.querySelector('.panel-number').textContent = `Panel ${index + 1}`;
	});
}

async function handleUpload(event) {
	event.preventDefault();
	const status = document.getElementById('uploadStatus');
	status.innerHTML = 'Starting upload...';

	try {
		const s3 = new AWS.S3();
		
		// Generate slug from title
		const slug = document.getElementById('title').value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');

		// Collect metadata
		const metadata = {
			id: generateUUID(),
			title: document.getElementById('title').value,
			slug,
			caption: document.getElementById('caption').value,
			tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()),
			happenedOnDate: document.getElementById('happenedOnDate').value,
			scrollStyle: document.getElementById('scrollStyle').value,
			postedTimestamp: document.getElementById('postedTimestamp').value || new Date().toISOString(),
			integrations: Array.from(document.querySelectorAll('input[name="integration"]:checked'))
				.map(checkbox => ({
					type: checkbox.value,
					use: true
				})),
			images: []
		};

		// Process panels in order
		const panels = document.querySelectorAll('.panel-item');
		console.log('Panels to process:', Array.from(panels).map(panel => ({
			filename: panel.dataset.filename,
			hasFile: !!panel.file,
			fileSize: panel.file?.size
		})));

		for (let panel of panels) {
			const filename = panel.dataset.filename;
			const file = panel.file;

			if (!file) {
				console.error('No file found for panel');
				continue;
			}

			console.log(`Uploading file: ${filename}`);

			try {
				// Upload image
				const panelKey = `comics/${filename}`;
				await s3.upload({
					Bucket: config.bucketName,
					Key: panelKey,
					ContentType: file.type,
					Body: file
				}).promise();

				// Add to metadata
				metadata.images.push({
					key: panelKey,
					altText: panel.querySelector('.alt-text-input').value
				});

				status.innerHTML += `<p>Uploaded panel ${metadata.images.length}...</p>`;
			} catch (uploadError) {
				console.error('Error uploading file:', uploadError);
				status.innerHTML += `<p class="error">Error uploading ${filename}: ${uploadError.message}</p>`;
			}
		}

		console.log('Final metadata:', metadata);

		// Upload metadata
		await s3.upload({
			Bucket: config.bucketName,
			Key: `uploads/${Date.now()}.json`,
			ContentType: 'application/json',
			Body: JSON.stringify(metadata)
		}).promise();

		status.innerHTML = '<p>Upload completed successfully!</p>';
		document.getElementById('uploadForm').reset();
		document.getElementById('panelsContainer').innerHTML = '';

	} catch (error) {
		console.error('Upload error:', error);
		status.innerHTML = `<p class="error">Upload failed: ${error.message}</p>`;
	}
}

document.addEventListener('change', (e) => {
	if (e.target.classList.contains('position-input')) {
		const panel = e.target.closest('.image-panel');
		const newPosition = parseInt(e.target.value) - 1;
		moveToPosition(panel, newPosition);
	}
});