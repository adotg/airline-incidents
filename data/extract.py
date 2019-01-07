import glob
import json
import re
from lxml import etree
from io import StringIO

EXT = '-raw.html'
RAW_FILE_PATTERN = '*' + EXT
OUTPUT_FILE = 'data.json'
CONTENT_BLACKLIST = '^\W+$|\s*read more\s*'
DATE_REGEXP = 'on (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})(st|nd|rd|th) (\d{4}),'
FINAL_DATA = []

parser = etree.HTMLParser()

def extractInf (subtree):
    resp = { 'fullDoc': None, 'img': None, 'content': None, 'date': None }

    for links in subtree.xpath('./div[contains(@class, "post-thumb")]/a'):
        resp['fullDoc'] = links.get('href')
        for img in links.xpath('./img'):
            resp['img'] = img.get('src')

    for main in subtree.xpath('./div[contains(@class, "post-content")]'):
        n_texts = filter(lambda x: False if re.search(CONTENT_BLACKLIST, x) else True, main.xpath('.//text()'))
        n_texts = map(lambda x: re.sub(r'^\n*\s*|\n*\s*$', '', x), n_texts)
        resp['content'] = list(n_texts)
    return resp

def processInf (inf):
    head = inf['content'][0]
    date_extract = re.search(DATE_REGEXP, head)

    if date_extract == None:
        return None
    
    if date_extract:
        date = date_extract.group(1) + '-' + date_extract.group(2) + '-' + date_extract.group(4)
        inf['date'] = date

    return inf

def normalizeToTabular (key, data):
    n_data = []
    for entry in data:
        n_data.append([key, entry['date'], entry])

    return n_data


for raw_file in glob.glob(RAW_FILE_PATTERN):
    in_file = open(raw_file, 'r')
    content = in_file.read()
    in_file.close()

    data = [] 
    root = etree.parse(StringIO(content), parser)
    for elem in root.xpath('.//div[contains(@class, "post-container")]'):
        processedVal = processInf(extractInf(elem))
        if (processedVal == None):
            continue

        data.append(processedVal)

    # Substring without the extension, which gives the airline name
    n_list = normalizeToTabular(raw_file[:len(raw_file) - len(EXT)], data)
    for sublist in n_list:
        FINAL_DATA.append(sublist)

with open(OUTPUT_FILE, 'w+') as out_file:
    json.dump(FINAL_DATA, out_file)
