export type Section = {
  readonly heading: string;
  readonly level: number;
  readonly path: string;
  readonly startOffset: number;
};

export type CodeBlock = {
  readonly code: string;
  readonly language: string | undefined;
  readonly section: Section;
};

export type ParseResult = {
  readonly codeBlocks: readonly CodeBlock[];
  readonly sections: readonly Section[];
};
