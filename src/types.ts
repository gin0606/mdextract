export type Section = {
  readonly heading: string;
  readonly level: number;
  readonly path: string;
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

export type CliOptions = {
  readonly dryRun: boolean;
  readonly file: string;
  readonly list: boolean;
  readonly sectionPath: string | undefined;
};
