import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { DraggablePanel } from './DraggablePanel';
import './PanelReorderScreen.css';

interface ImageData {
  file: File;
  preview: string;
  altText?: string;
}

interface PanelReorderScreenProps {
  images: ImageData[];
  onReorder: (newOrder: ImageData[]) => void;
  onSkip: () => void;
  scrollStyle: 'carousel' | 'long-form';
}

export const PanelReorderScreen: React.FC<PanelReorderScreenProps> = ({
  images,
  onReorder,
  onSkip,
  scrollStyle,
}) => {
  const [orderedImages, setOrderedImages] = useState<ImageData[]>(images);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(orderedImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedImages(items);
  };

  const handleApplyOrder = () => {
    onReorder(orderedImages);
  };

  const handleReset = () => {
    setOrderedImages(images);
  };

  return (
    <div className="panel-reorder-screen">
      <div className="reorder-header">
        <h2>Reorder Panels</h2>
        <p>
          Drag and drop to reorder your comic panels. This will determine the reading order
          for your comic.
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="panels">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="panels-container"
            >
              {orderedImages.map((image, index) => (
                <DraggablePanel key={`panel-${index}`} image={image} index={index} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="preview-section">
        <h3>Preview ({scrollStyle === 'carousel' ? 'Carousel' : 'Long Form'})</h3>
        <div className={`preview-container ${scrollStyle}`}>
          {scrollStyle === 'carousel' ? (
            <div className="carousel-preview">
              <img
                src={orderedImages[0]?.preview}
                alt="First panel preview"
                className="preview-image"
              />
              <div className="carousel-indicator">
                Panel 1 of {orderedImages.length}
              </div>
            </div>
          ) : (
            <div className="longform-preview">
              {orderedImages.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={image.preview}
                  alt={`Panel ${index + 1} preview`}
                  className="preview-image"
                />
              ))}
              {orderedImages.length > 3 && (
                <div className="more-panels">
                  + {orderedImages.length - 3} more panels
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="reorder-actions">
        <button type="button" onClick={handleReset} className="reset-button">
          Reset Order
        </button>
        <button type="button" onClick={onSkip} className="skip-button">
          Skip (Keep Upload Order)
        </button>
        <button type="button" onClick={handleApplyOrder} className="apply-button">
          Apply Order & Continue
        </button>
      </div>
    </div>
  );
};
