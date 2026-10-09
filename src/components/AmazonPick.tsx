/** Amazon Associates card (tag possjonah-20) + required disclosure. Sits under the Home tools. */
export function AmazonPick() {
  return (
    <aside className="amazon-card" aria-label="Craft supplies on Amazon">
      <div className="amazon-card-head">Supplies for your makes</div>
      <div className="amazon-card-btns">
        <a className="amazon-btn" href="https://www.amazon.com/s?k=wired+ribbon&tag=possjonah-20" target="_blank" rel="sponsored noopener">Shop ribbon on Amazon</a>
        <a className="amazon-btn" href="https://www.amazon.com/s?k=wreath+forms&tag=possjonah-20" target="_blank" rel="sponsored noopener">Shop wreath forms on Amazon</a>
      </div>
      <p className="amazon-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>
    </aside>
  );
}
