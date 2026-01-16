export function FontPreload() {
  return (
    <>
      <link
        rel="preload"
        href="/fonts/LINESeedSansTH_W_Rg.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/LINESeedSansTH_W_Bd.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/LINESeedSansTH_W_Th.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </>
  );
}

