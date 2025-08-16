import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from '../Toast';

describe('Toast Component', () => {
  it('renders toast message correctly', () => {
    const title = 'Test Title';
    const message = 'Test toast message';
    render(<Toast id="test-1" title={title} message={message} type="success" onClose={() => {}} />);
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();
    
    render(<Toast id="test-2" title="Test" message="Test message" type="success" onClose={onCloseMock} />);
    
    const closeButton = screen.getByRole('button');
    await user.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledWith('test-2');
  });

  it('renders different types correctly', () => {
    const { rerender } = render(<Toast id="test-3" title="Success" message="Success message" type="success" onClose={() => {}} />);
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(<Toast id="test-4" title="Error" message="Error message" type="error" onClose={() => {}} />);
    expect(screen.getByText('Error')).toBeInTheDocument();

    rerender(<Toast id="test-5" title="Warning" message="Warning message" type="warning" onClose={() => {}} />);
    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(<Toast id="test-6" title="Info" message="Info message" type="info" onClose={() => {}} />);
    expect(screen.getByText('Info')).toBeInTheDocument();
  });
});