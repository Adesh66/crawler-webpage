const rp = require('request-promise');
const cheerio = require('cheerio');
const process = require('process');
var JSSoup = require('jssoup').default;
const fs = require('fs');
const { default: axios } = require('axios');

let url = 'https://www.google.com/';

var args = process.argv;
if (args.length <= 2) {
    throw new Error('Enter a valid url to crawl');
}

let depth = 1;
if (args.length > 2) {
    if (args[2]) url = args[2];
    if (args[3]) depth = args[3];
}

let result = [];
const options = {
    uri: url,
    transform: (html) => cheerio.load(html),
};

function getWebpageLinks(response) {
    var arrLinks = [];
    var links = response.findAll('a');
    for (const link of links) {
        let attr = link.attrs.href;
        if (attr) {
            arrLinks.push(attr);
        }
    }
    return arrLinks;
}

async function renderResult(url, depth = 0) {
    const imagList = [];
    let currentURLList = [url];

    for (let i = 0; i <= depth; i++) {
        if (i > 0) currentURLList = [];
        for (const _url of currentURLList) {
            const data = await getSoupResponse(_url, i);
            if (data) {
                const imgListRsponse = getImageList(data, _url, i);
                imagList.push(...imgListRsponse);
            }
            if (depth == i) {
                break;
            }
            if (data) {
                currentURLList.push(...getWebpageLinks(data));
            }
        }
    }

    return imagList;
}

async function getSoupResponse(url, depth) {
    try {
        console.log(`fetching=> ${url}`);
        const res = await axios.get(url);
        var soup = new JSSoup(res.data);
        return soup;
    } catch (error) {
        console.log(`unable to fetch webpage=> ${url} `);
    }
}
function getImageList(response, url, depth) {
    var list = [];
    var ImageListRes = response.findAll('img');
    for (const img of ImageListRes) {
        let imgVal = img.attrs.src;
        if (imgVal) {
            const obj = {
                imageUrl: imgVal,
                sourceUrl: url,
                depth,
            };
            list.push(obj);
        }
    }
    return list;
}

renderResult(url, depth).then((res) => {
    let dataToSave = { result: res };
    fs.writeFile('result.json', JSON.stringify(dataToSave), function (err) {
        if (err) throw err;
    });
});
