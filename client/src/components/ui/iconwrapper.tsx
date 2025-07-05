import {
  cloneElement,
  isValidElement,
  ReactElement,
  CSSProperties,
} from 'react';
import { clsx } from 'clsx';

type IconWrapperProps = {
  children: ReactElement<{ className?: string }>;
  className?: string;
  style?: CSSProperties;
};

const hasSizeClass = (className = '') =>
  /\bw-(\d+|auto)\b/.test(className) && /\bh-(\d+|auto)\b/.test(className);

export const IconWrapper = ({
  children,
  className,
  style,
}: IconWrapperProps) => {
  const originalClass = children.props.className ?? '';

  const icon = isValidElement(children)
    ? cloneElement(children, {
        className: hasSizeClass(originalClass)
          ? originalClass
          : clsx('w-5 h-5', originalClass),
      })
    : children;

  return (
    <div
      className={clsx(
        'w-10 h-10 min-w-10 max-w-10 min-h-10 max-h-10 rounded-full flex items-center justify-center bg-neutral-300',
        className,
      )}
      style={style}
    >
      {icon}
    </div>
  );
};
