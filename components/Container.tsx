import React, { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
};

/**
 * Provides a responsive container for content, adjusting margins and max-width
 * for mobile, tablet, and desktop viewports.
 *
 * @param {ReactNode} children Content to be displayed within.
 */
const Container = ({ children }: ContainerProps) => {
  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 mx-auto max-w-7xl">
      {children}
    </div>
  );
};

export default Container;
