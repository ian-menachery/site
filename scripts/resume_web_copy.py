"""Web copy of the resume: contact line rewritten without the phone number."""
import re, sys
import pymupdf

src, dst = sys.argv[1], sys.argv[2]
FONT = r"C:/Windows/Fonts/GARA.TTF"
SIZE, BASELINE, Y0, Y1 = 10.56, 42.72, 33.62, 45.6
parts = [("ianmenachery@gmail.com", "mailto:ianmenachery@gmail.com"), (" | ", None),
         ("linkedin.com/in/ianmenachery", "http://linkedin.com/in/ianmenachery"), (" | ", None),
         ("github.com/ian-menachery", "http://github.com/ian-menachery")]

doc = pymupdf.open(src)
page = doc[0]
assert re.search(r"\+1 \(\d{3}\) \d{3}-\d{4}", page.get_text())
for link in page.get_links():
    if link["from"].y0 < Y1:
        page.delete_link(link)
page.add_redact_annot(pymupdf.Rect(0, Y0, page.rect.width, Y1))
page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)

font = pymupdf.Font(fontfile=FONT)
page.insert_font(fontname="gara", fontfile=FONT)
total = sum(font.text_length(t, SIZE) for t, _ in parts)
x = (page.rect.width - total) / 2
for text, uri in parts:
    w = font.text_length(text, SIZE)
    page.insert_text((x, BASELINE), text, fontname="gara", fontsize=SIZE)
    if uri:
        page.insert_link({"kind": pymupdf.LINK_URI, "uri": uri, "from": pymupdf.Rect(x, Y0, x + w, Y1)})
    x += w

doc.set_metadata({"title": "Ian Menachery Resume", "author": "Ian Menachery"})
doc.save(dst, garbage=4, deflate=True)
out = pymupdf.open(dst)
text = out[0].get_text()
assert not re.search(r"\(\d{3}\)", text), "phone survived"
assert len(out) == 1
print(ascii(text.split("\n")[:3]), [l.get("uri") for l in out[0].get_links()][:3])
out[0].get_pixmap(dpi=110, clip=pymupdf.Rect(0, 0, 612, 90)).save(sys.argv[3])
