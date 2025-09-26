declare module "react" {
  const React: any;
  export = React;
  export as namespace React;
  export const useState: any;
  export const useEffect: any;
  export const ChangeEvent: any;
  export const FormEvent: any;
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "next/script" {
  const Script: any;
  export default Script;
}

declare module "next/link" {
  const Link: any;
  export default Link;
}

declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
    keywords?: string[];
    authors?: Array<{ name: string }>;
    openGraph?: any;
    twitter?: any;
    viewport?: string;
    robots?: any;
  }
}

declare module "next/server" {
  export class NextRequest {
    json(): Promise<any>;
  }
  export class NextResponse {
    static json(data: any, init?: { status?: number }): NextResponse;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }

    interface Element extends React.ReactElement<any, any> {}

    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }

    interface ElementAttributesProperty {
      props: {};
    }

    interface ElementChildrenAttribute {
      children: {};
    }
  }

  namespace React {
    type ReactElement<
      P = any,
      T extends string | JSXElementConstructor<any> =
        | string
        | JSXElementConstructor<any>
    > = any;
    type ReactNode = any;
    type Component<P = {}, S = {}> = any;
    interface FunctionComponent<P = {}> {
      (props: P, context?: any): ReactElement<any, any> | null;
    }
    type JSXElementConstructor<P> = any;
  }
}

export {};
