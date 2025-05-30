import React, { useState } from 'react';
import { RoomCategory, RoomFilter } from '../../types';
import { Search, Filter } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';

interface RoomFiltersProps {
  onFilterChange: (filter: RoomFilter) => void;
}

const RoomFilters: React.FC<RoomFiltersProps> = ({ onFilterChange }) => {
  const [category, setCategory] = useState<RoomCategory | ''>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const categories: RoomCategory[] = ['Double', 'Couple', 'Connecting'];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If end date is not set, use start date + 1 day
    let effectiveEndDate = endDate;
    if (startDate && !endDate) {
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      effectiveEndDate = nextDay;
    }
    
    onFilterChange({
      category: category ? category as RoomCategory : undefined,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: effectiveEndDate ? format(effectiveEndDate, 'yyyy-MM-dd') : undefined,
    });
  };
  
  const handleClearFilters = () => {
    setCategory('');
    setStartDate(null);
    setEndDate(null);
    onFilterChange({});
  };

  const CustomInput = React.forwardRef(({ value, onClick }: any, ref: any) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-40 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-white text-left"
    >
      {value || 'Select date'}
    </button>
  ));
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Room Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as RoomCategory | '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        
<div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            customInput={<CustomInput />}
            dateFormat="dd/MM/yyyy"
            isClearable
            placeholderText="Select start date"
            todayButton="Today"
            className="w-full"
            calendarClassName="border border-gray-200 rounded-lg shadow-lg"
            showPopperArrow={false}
          />
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            customInput={<CustomInput />}
            dateFormat="dd/MM/yyyy"
            isClearable
            placeholderText="Select end date"
            todayButton="Today"
            minDate={startDate}
            disabled={!startDate}
            className="w-full"
            calendarClassName="border border-gray-200 rounded-lg shadow-lg"
            showPopperArrow={false}
          />
        </div>
        
        <div className="flex items-end space-x-2">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </button>
          
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Clear
          </button>
        </div>
      </div>
    </form>
  );
};

export default RoomFilters;