#!/usr/bin/env python3
"""Build public/HerbalHarbour-Live.xlsx with Excel web-query connections."""
import zipfile
from pathlib import Path

BASE = "https://api.herbalharbour.co.za/export.php"
PLACEHOLDER = "PASTE_EXPORT_KEY"

def sheet_xml(rows):
    body = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>']
    for r, row in enumerate(rows, 1):
        body.append(f'<row r="{r}">')
        for c, value in enumerate(row, 1):
            col = chr(64 + c)
            text = (str(value)
                    .replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;"))
            body.append(f'<c r="{col}{r}" t="inlineStr"><is><t xml:space="preserve">{text}</t></is></c>')
        body.append("</row>")
    body.append("</sheetData></worksheet>")
    return "".join(body)

def connection(cid, name, sheet):
    url = f"{BASE}?sheet={sheet}&amp;format=csv&amp;key={PLACEHOLDER}"
    return (
        f'<connection id="{cid}" name="{name}" type="5" refreshedVersion="6" background="1" '
        f'saveData="1" interval="10">'
        f'<webPr url="{url}" htmlTables="0" xml="0"/>'
        f"</connection>"
    )

instructions = [
    ["Herbal Harbour live workbook"],
    ["1. Paste the export key from server/config.php into Settings!B2."],
    ["2. Data > Queries & Connections > right-click each connection > Edit."],
    ["3. Replace PASTE_EXPORT_KEY in the URL with the value from Settings!B2."],
    ["4. Data > Queries & Connections > Properties > Refresh every 10 minutes."],
    ["Or use Power Query (Data > Get Data > Blank Query) and paste this M code:"],
    ['let Key = Excel.CurrentWorkbook(){[Name="ExportKey"]}[Content]{0}[Column1],'],
    ['Source = Csv.Document(Web.Contents("https://api.herbalharbour.co.za/export.php",'],
    ['[Query=[key=Key, sheet="products", format="csv"]]), [Delimiter=",", Encoding=65001]),'],
    ["Promoted = Table.PromoteHeaders(Source, [PromoteAllScalars=true]) in Promoted"],
    ["Duplicate that query with sheet = orders and sheet = movements."],
    ["The shop does not read this file back. Refresh pulls the live MySQL catalogue."],
]

files = {
    "[Content_Types].xml": """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet5.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/connections.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml"/>
</Types>""",
    "_rels/.rels": """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""",
    "xl/_rels/workbook.xml.rels": """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet5.xml"/>
<Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/connections" Target="connections.xml"/>
</Relationships>""",
    "xl/workbook.xml": """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
<sheet name="How to connect" sheetId="1" r:id="rId1"/>
<sheet name="Settings" sheetId="2" r:id="rId2"/>
<sheet name="Products" sheetId="3" r:id="rId3"/>
<sheet name="Orders" sheetId="4" r:id="rId4"/>
<sheet name="Movements" sheetId="5" r:id="rId5"/>
</sheets>
<definedNames>
<definedName name="ExportKey">Settings!$B$2</definedName>
</definedNames>
</workbook>""",
    "xl/connections.xml": """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<connections xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
""" + connection(1, "Products", "products") + connection(2, "Orders", "orders") + connection(3, "Movements", "movements") + """
</connections>""",
    "xl/worksheets/sheet1.xml": sheet_xml(instructions),
    "xl/worksheets/sheet2.xml": sheet_xml([["Setting", "Value"], ["Export key", ""]]),
    "xl/worksheets/sheet3.xml": sheet_xml([["Refresh the Products connection. Headers arrive from the API."]]),
    "xl/worksheets/sheet4.xml": sheet_xml([["Refresh the Orders connection."]]),
    "xl/worksheets/sheet5.xml": sheet_xml([["Refresh the Movements connection."]]),
}

out = Path("public/HerbalHarbour-Live.xlsx")
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for name, content in files.items():
        archive.writestr(name, content)
print(out, out.stat().st_size)
