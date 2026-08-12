declare module '@jsreport/jsreport-core' {
  type RenderResult = { content: Buffer };
  type Reporter = {
    use: (extension: unknown) => Reporter;
    init: () => Promise<Reporter>;
    render: (request: unknown) => Promise<RenderResult>;
  };
  export default function JsReport(options?: Record<string, unknown>): Reporter;
}

declare module '@jsreport/jsreport-handlebars' {
  export default function JsReportHandlebars(options?: Record<string, unknown>): unknown;
}

declare module '@jsreport/jsreport-chrome-pdf' {
  export default function JsReportChromePdf(options?: Record<string, unknown>): unknown;
}
