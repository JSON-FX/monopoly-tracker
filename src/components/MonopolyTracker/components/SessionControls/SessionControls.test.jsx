import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionControls from './SessionControls';

describe('SessionControls', () => {
  const mockOnStartSession = jest.fn();
  const mockOnEndSession = jest.fn();
  const mockOnClearSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('When session is not active', () => {
    it('should render start session button', () => {
      render(
        <SessionControls
          sessionActive={false}
          isTargetAchieved={false}
          onStartSession={mockOnStartSession}
          onEndSession={mockOnEndSession}
          onClearSession={mockOnClearSession}
        />
      );

      expect(screen.getByText('💰 Start Session')).toBeInTheDocument();
    });

    it('should call onStartSession when start button is clicked', () => {
      render(
        <SessionControls
          sessionActive={false}
          isTargetAchieved={false}
          onStartSession={mockOnStartSession}
          onEndSession={mockOnEndSession}
          onClearSession={mockOnClearSession}
        />
      );

      fireEvent.click(screen.getByText('💰 Start Session'));
      expect(mockOnStartSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('When session is active', () => {
    it('should render end and clear buttons when target not achieved', () => {
      render(
        <SessionControls
          sessionActive={true}
          isTargetAchieved={false}
          onStartSession={mockOnStartSession}
          onEndSession={mockOnEndSession}
          onClearSession={mockOnClearSession}
        />
      );

      expect(screen.getByText('⏹️ End')).toBeInTheDocument();
      expect(screen.getByText('🗑️ Clear')).toBeInTheDocument();
    });

    it('should render only end button when target is achieved', () => {
      render(
        <SessionControls
          sessionActive={true}
          isTargetAchieved={true}
          onStartSession={mockOnStartSession}
          onEndSession={mockOnEndSession}
          onClearSession={mockOnClearSession}
        />
      );

      expect(screen.getByText('End Session')).toBeInTheDocument();
      expect(screen.queryByText('🗑️ Clear')).not.toBeInTheDocument();
    });

    it('should call onEndSession when end button is clicked', () => {
      render(
        <SessionControls
          sessionActive={true}
          isTargetAchieved={false}
          onStartSession={mockOnStartSession}
          onEndSession={mockOnEndSession}
          onClearSession={mockOnClearSession}
        />
      );

      fireEvent.click(screen.getByText('⏹️ End'));
      expect(mockOnEndSession).toHaveBeenCalledTimes(1);
    });

    it('should call onClearSession when clear button is clicked', () => {
      render(
        <SessionControls
          sessionActive={true}
          isTargetAchieved={false}
          onStartSession={mockOnStartSession}
          onEndSession={mockOnEndSession}
          onClearSession={mockOnClearSession}
        />
      );

      fireEvent.click(screen.getByText('🗑️ Clear'));
      expect(mockOnClearSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should render error message when onStartSession is not a function', () => {
      render(
        <SessionControls
          sessionActive={false}
          isTargetAchieved={false}
          onStartSession={null}
          onEndSession={mockOnEndSession}
          onClearSession={mockOnClearSession}
        />
      );

      expect(screen.getByText('Error: Missing start session handler')).toBeInTheDocument();
    });

    it('should render error message when onEndSession is not a function', () => {
      render(
        <SessionControls
          sessionActive={true}
          isTargetAchieved={false}
          onStartSession={mockOnStartSession}
          onEndSession={null}
          onClearSession={mockOnClearSession}
        />
      );

      expect(screen.getByText('Error: Missing end session handler')).toBeInTheDocument();
    });

    it('should render error message when onClearSession is not a function', () => {
      render(
        <SessionControls
          sessionActive={true}
          isTargetAchieved={false}
          onStartSession={mockOnStartSession}
          onEndSession={mockOnEndSession}
          onClearSession={null}
        />
      );

      expect(screen.getByText('Error: Missing clear session handler')).toBeInTheDocument();
    });
  });
}); 