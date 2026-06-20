import React, { useState, useRef } from 'react';
import { 
  Calendar, 
  CalendarRange, 
  Sun, 
  Moon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsUpDown, 
  Trash2, 
  CalendarDays,
  Pencil,
  Check,
  X
} from 'lucide-react';
import './App.css';
import type { ExpenseItem, ExpenseStore } from './types';
import { 
  getMonday, 
  getWeekDays, 
  getWeekNumber, 
  formatDateRange, 
  formatDayName, 
  toISODateString 
} from './utils';

const LOCAL_STORAGE_KEY = 'minimalist_expense_tracker_data';

// Custom price formatter for Philippine Peso (₱)
const formatPeso = (amount: number): string => {
  return '₱' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

function App() {
  const [currentView, setCurrentView] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [expenses, setExpenses] = useState<ExpenseStore>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load expenses from localStorage', e);
      return {};
    }
  });
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Inline Editing States
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editTag, setEditTag] = useState<string | undefined>(undefined);

  // Save expenses helper
  const saveExpensesToStore = (newExpenses: ExpenseStore) => {
    setExpenses(newExpenses);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newExpenses));
    } catch (e) {
      console.error('Failed to save expenses to localStorage', e);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  // Navigation handlers
  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate.getTime());
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate.getTime());
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(new Date(e.target.value));
    }
  };

  const triggerDatePicker = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        dateInputRef.current.click();
      }
    }
  };

  // Calculate days for the currently selected week
  const monday = getMonday(selectedDate);
  const weekDays = getWeekDays(monday);
  const weekNumber = getWeekNumber(monday);

  // Totals calculations
  const getDayTotal = (dateStr: string): number => {
    const items = expenses[dateStr] || [];
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const getWeeklyTotal = (): number => {
    return weekDays.reduce((sum, d) => sum + getDayTotal(toISODateString(d)), 0);
  };

  // Toggle single day row
  const toggleDayRow = (dateStr: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  // Toggle all days in the week
  const weekDayStrings = weekDays.map(d => toISODateString(d));
  const isAllExpanded = weekDayStrings.every(dayStr => expandedDays[dayStr]);

  const toggleExpandAll = () => {
    const newExpanded = { ...expandedDays };
    if (isAllExpanded) {
      weekDayStrings.forEach(dayStr => {
        newExpanded[dayStr] = false;
      });
    } else {
      weekDayStrings.forEach(dayStr => {
        newExpanded[dayStr] = true;
      });
    }
    setExpandedDays(newExpanded);
  };

  // Add item
  const handleAddItem = (dateStr: string, description: string, price: number, tag?: string) => {
    const newItem: ExpenseItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      description,
      price,
      tag,
      createdAt: Date.now()
    };
    const dayItems = expenses[dateStr] ? [...expenses[dateStr], newItem] : [newItem];
    const newExpenses = {
      ...expenses,
      [dateStr]: dayItems
    };
    saveExpensesToStore(newExpenses);
  };

  // Delete item
  const handleDeleteItem = (dateStr: string, itemId: string) => {
    if (!expenses[dateStr]) return;
    const dayItems = expenses[dateStr].filter(item => item.id !== itemId);
    const newExpenses = {
      ...expenses,
      [dateStr]: dayItems
    };
    saveExpensesToStore(newExpenses);
  };

  // Editing helpers
  const startEdit = (item: ExpenseItem) => {
    setEditingItemId(item.id);
    setEditDescription(item.description);
    setEditPrice(item.price.toString());
    setEditTag(item.tag);
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditDescription('');
    setEditPrice('');
    setEditTag(undefined);
  };

  const handleSaveEdit = (e: React.FormEvent, dateStr: string, itemId: string) => {
    e.preventDefault();
    if (!editDescription.trim() || !editPrice || !expenses[dateStr]) return;

    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return;

    const newExpenses = {
      ...expenses,
      [dateStr]: expenses[dateStr].map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            description: editDescription.trim(),
            price: parsedPrice,
            tag: editTag
          };
        }
        return item;
      })
    };
    saveExpensesToStore(newExpenses);
    cancelEdit();
  };

  return (
    <>
      {/* Sticky Header */}
      <header className="sticky-header">
        <h1 className="header-title">Expense</h1>
        <div className="header-actions">
          <button 
            className={`header-btn ${currentView === 'weekly' ? 'active' : ''}`}
            onClick={() => setCurrentView('weekly')}
            title="Weekly View"
            aria-label="Weekly View"
          >
            <CalendarRange size={16} strokeWidth={1.75} />
          </button>
          <button 
            className={`header-btn ${currentView === 'monthly' ? 'active' : ''}`}
            onClick={() => setCurrentView('monthly')}
            title="Monthly View"
            aria-label="Monthly View"
          >
            <Calendar size={16} strokeWidth={1.75} />
          </button>
          <button 
            className="header-btn" 
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
          </button>
        </div>
      </header>

      {/* Main View Area */}
      {currentView === 'weekly' ? (
        <main className="accordion-container">
          {/* Week Selector navigation row */}
          <div className="week-nav-row">
            <div className="week-nav-left">
              <button 
                className="icon-btn-minimal" 
                onClick={handlePrevWeek}
                title="Previous Week"
                aria-label="Previous Week"
              >
                <ChevronLeft size={16} />
              </button>
              
              <button 
                className="icon-btn-minimal" 
                onClick={triggerDatePicker}
                title="Select Specific Date/Week"
                aria-label="Select Specific Date/Week"
              >
                <CalendarDays size={14} />
              </button>
              <input 
                type="date" 
                ref={dateInputRef} 
                onChange={handleDateChange} 
                className="hidden-input" 
                aria-hidden="true"
              />

              <button 
                className="icon-btn-minimal" 
                onClick={handleNextWeek}
                title="Next Week"
                aria-label="Next Week"
              >
                <ChevronRight size={16} />
              </button>
              
              <span className="week-title">
                Week {weekNumber} - {formatDateRange(monday)}
              </span>
            </div>

            <div className="week-nav-right">
              <span className="week-total">{formatPeso(getWeeklyTotal())}</span>
              <button 
                className="icon-btn-minimal" 
                onClick={toggleExpandAll}
                title={isAllExpanded ? "Collapse All Days" : "Expand All Days"}
                aria-label="Toggle All Days"
              >
                <ChevronsUpDown size={14} />
              </button>
            </div>
          </div>

          {/* Collapsible rows for each day */}
          {weekDays.map(day => {
            const dateStr = toISODateString(day);
            const isExpanded = !!expandedDays[dateStr];
            const dayItems = expenses[dateStr] || [];
            const dayTotal = getDayTotal(dateStr);

            return (
              <div key={dateStr} className="day-row">
                <div 
                  className="day-header" 
                  onClick={() => toggleDayRow(dateStr)}
                  title={isExpanded ? "Collapse Day" : "Expand Day"}
                >
                  <div className="day-header-left">
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <ChevronRight 
                        size={14} 
                        style={{ 
                          transform: isExpanded ? 'rotate(90deg)' : 'none', 
                          transition: 'transform 0.1s ease',
                          color: '#888'
                        }} 
                      />
                    </span>
                    <span className="day-name">{formatDayName(day)}</span>
                  </div>
                  <div className="day-header-right">
                    <span className="day-total">{formatPeso(dayTotal)}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="day-content">
                    <div className="expense-list">
                      {dayItems.length === 0 ? (
                        <div className="no-expenses">No expenses listed</div>
                      ) : (
                        dayItems.map(item => {
                          const isEditing = editingItemId === item.id;
                          return (
                            <div key={item.id} className="expense-item">
                              {isEditing ? (
                                <form className="edit-inline-form" onSubmit={(e) => handleSaveEdit(e, dateStr, item.id)}>
                                  <div className="edit-inline-row">
                                    <input 
                                      type="text" 
                                      className="input-minimal edit-input-desc" 
                                      value={editDescription} 
                                      onChange={e => setEditDescription(e.target.value)} 
                                      required 
                                      autoFocus
                                    />
                                    <div className="input-price-container" style={{ width: '65px' }}>
                                      <span className="price-symbol">₱</span>
                                      <input 
                                        type="number" 
                                        step="0.01" 
                                        min="0.01" 
                                        className="input-minimal edit-input-price" 
                                        value={editPrice} 
                                        onChange={e => setEditPrice(e.target.value)} 
                                        required 
                                      />
                                    </div>
                                    <div className="edit-actions">
                                      <button type="submit" className="edit-action-btn save" title="Save changes" aria-label="Save changes">
                                        <Check size={12} />
                                      </button>
                                      <button type="button" className="edit-action-btn cancel" onClick={cancelEdit} title="Cancel editing" aria-label="Cancel editing">
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="tag-selector" style={{ marginTop: '2px' }}>
                                    {TAG_OPTIONS.map(tag => (
                                      <button
                                        key={tag}
                                        type="button"
                                        className={`tag-pill tag-${tag} ${editTag === tag ? 'active' : ''}`}
                                        onClick={() => setEditTag(editTag === tag ? undefined : tag)}
                                      >
                                        {tag}
                                      </button>
                                    ))}
                                  </div>
                                </form>
                              ) : (
                                <div className="expense-info">
                                  <span className="expense-name">
                                    {item.description}
                                    {item.tag && <span className={`expense-tag tag-${item.tag}`} style={{ marginLeft: '6px' }}>{item.tag}</span>}
                                  </span>
                                  <span className="expense-price">{formatPeso(item.price)}</span>
                                  <div className="expense-actions">
                                    <button 
                                      className="expense-action-btn edit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEdit(item);
                                      }}
                                      title="Edit expense"
                                      aria-label="Edit expense"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button 
                                      className="expense-action-btn delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteItem(dateStr, item.id);
                                      }}
                                      title="Delete expense"
                                      aria-label="Delete expense"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <AddExpenseInlineForm 
                      onAdd={(desc, price, tag) => handleAddItem(dateStr, desc, price, tag)} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </main>
      ) : (
        /* Monthly View Empty Placeholder */
        <div className="empty-view-placeholder">
          <Calendar size={32} strokeWidth={1.5} />
          <h3>Monthly View</h3>
          <p>Monthly overview will be available soon.</p>
        </div>
      )}
    </>
  );
}

// Inline form component helper
interface AddExpenseInlineFormProps {
  onAdd: (description: string, price: number, tag?: string) => void;
}

const TAG_OPTIONS = ['food', 'gas', 'water', 'bills', 'other'];

const AddExpenseInlineForm: React.FC<AddExpenseInlineFormProps> = ({ onAdd }) => {
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !price) return;
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return;

    onAdd(description.trim(), parsedPrice, selectedTag);
    setDescription('');
    setPrice('');
    setSelectedTag(undefined);
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <div className="add-form-row">
        <input
          type="text"
          placeholder="Expense details"
          className="input-minimal input-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <div className="input-price-container">
          <span className="price-symbol">₱</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="input-minimal input-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-add">
          Add
        </button>
      </div>
      <div className="tag-selector">
        {TAG_OPTIONS.map(tag => (
          <button
            key={tag}
            type="button"
            className={`tag-pill tag-${tag} ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </form>
  );
};

export default App;
