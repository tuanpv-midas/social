declare module 'react-quill' {
  import React from 'react';
  
  export interface ReactQuillProps {
    value?: string;
    onChange?: (content: string) => void;
    onChangeSelection?: (range: Range, source: string, editor: any) => void;
    onFocus?: (range: Range, source: string, editor: any) => void;
    onBlur?: (previousRange: Range, source: string, editor: any) => void;
    onKeyPress?: React.KeyboardEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    onKeyUp?: React.KeyboardEventHandler<HTMLDivElement>;
    className?: string;
    style?: React.CSSProperties;
    readOnly?: boolean;
    placeholder?: string;
    preserveWhitespace?: boolean;
    formats?: string[];
    modules?: Record<string, any>;
    theme?: string;
    tabIndex?: number;
    bounds?: string | HTMLElement;
    children?: React.ReactElement;
  }

  export interface Range {
    index: number;
    length: number;
  }

  const ReactQuill: React.ForwardRefExoticComponent<
    ReactQuillProps & React.RefAttributes<any>
  > & {
    Quill: any;
  };

  export default ReactQuill;
}