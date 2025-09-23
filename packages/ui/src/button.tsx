import * as React from 'react';

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-2xl px-4 py-2 shadow-sm border text-sm ${props.className || ''}`}
    />
  );
}
