import React from 'react';
import { News } from './News';

interface UpdatesProps {
  navigate: (route: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenUpdate?: () => void;
}

export const Updates: React.FC<UpdatesProps> = ({ navigate, searchQuery, onSearchChange, onOpenUpdate }) => {
  return (
    <News 
      navigate={navigate} 
      searchQuery={searchQuery} 
      onSearchChange={onSearchChange} 
      onOpenUpdate={onOpenUpdate} 
    />
  );
};

export default Updates;
