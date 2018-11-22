import React from 'react';
import cls from 'classnames';

export default function Button(props) {
  const {
    children,
    kind = 'raw',
    loading = false,
    disabled = false,
    rounded = false,
    onClick
  } = props;

  const className = cls(
    'button',
    loading && 'is-loading',
    rounded && 'is-rounded',
    kind !== 'raw' && `is-${kind}`
  );

  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onClick={onClick}>
      {children}
    </button>
  );
}
