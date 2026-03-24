import Document, { Html, Head, Main, NextScript, type DocumentContext } from "next/document";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    return await Document.getInitialProps(ctx);
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
          <link
            href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
