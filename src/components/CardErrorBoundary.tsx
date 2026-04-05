import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/** Lightweight error boundary for individual cards — silently hides broken cards */
export class CardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Card render error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="px-4 py-6 text-center text-[12px] text-muted-foreground/40">
          خطا در نمایش این محتوا
        </div>
      );
    }
    return this.props.children;
  }
}
