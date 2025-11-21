import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import './DraggablePanel.css';

interface DraggablePanelProps {
  image: {
    file: File;
    preview: string;
    altText?: string;
  };
  index: number;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({ image, index }) => {
  return (
    <Draggable draggableId={`panel-${index}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`draggable-panel ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          <div className="panel-number">{index + 1}</div>
          <img
            src={image.preview}
            alt={image.altText || `Panel ${index + 1}`}
            className="panel-thumbnail"
          />
          <div className="panel-name">{image.file.name}</div>
        </div>
      )}
    </Draggable>
  );
};
