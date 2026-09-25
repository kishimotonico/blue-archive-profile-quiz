// jsdom 28はHTMLDialogElementのshowModal/closeを実装していないため、Modalのテストや
// Modalを開くページのテストに必要な最小限の挙動（open属性の付け外しとcloseイベントの発火）だけをスタブする。
// テスト環境がnodeのファイルにはHTMLDialogElement自体が存在しないため、その場合は何もしない。
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
