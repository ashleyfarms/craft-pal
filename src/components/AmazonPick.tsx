/** Small footer Amazon Associates link (tag possjonah-20) + required disclosure. */
export function AmazonPick() {
  return (
    <>
    <p className="help-pal-link">
      Get supplies on Amazon:{" "}
      <a href="https://www.amazon.com/s?k=wired+ribbon&tag=possjonah-20" target="_blank" rel="sponsored noopener">ribbon</a>
      {" · "}
      <a href="https://www.amazon.com/s?k=wreath+forms&tag=possjonah-20" target="_blank" rel="sponsored noopener">wreath forms</a>
    </p>
    <p className="help-pal-link" style={{ fontSize: "0.7em", opacity: 0.8 }}>
      As an Amazon Associate I earn from qualifying purchases.
    </p>
    </>
  );
}
