const request = require("request");
const cheerio = require("cheerio");
const fs = require('fs');
const path = require('path');
var dir = '.';

let url = "https://github.com/topics";
request(url, (err, response, html) => {
    if (err) {
        console.log("err");
    } else {
        extractHTML(html);
    }
})

function extractHTML(html) {
    let selectorTool = cheerio.load(html);
    let topics = selectorTool(".no-underline.d-flex.flex-column.flex-justify-center");
    let topicsLink = [];
    let topicsName = [];

    for (let i = 0; i < topics.length; i++) {
        let repoLink = "https://github.com" + selectorTool(topics[i]).attr("href");
        let repoName = repoLink.split("/").slice(-1)[0];

        topicsLink.push(repoLink);
        topicsName.push(repoName);
    }
    fetchTopicNameAndLinks(topicsLink, topicsName, 0);
}

function fetchTopicNameAndLinks(topicsLink, topicsName, idx) {
    if (idx < topicsLink.length) {
        //console.log("'''''''''''''''''''''''''''''''''''");
        console.log(topicsName[idx]);
        if (!fs.existsSync(path.join(dir, topicsName[idx]))) {
            fs.mkdirSync(path.join(dir, topicsName[idx]));
        }
        request(topicsLink[idx], (err, response, html) => {
            if (err) {
                console.log(err);
            } else {
                extractRepoHtml(html, topicsName[idx]);
                fetchTopicNameAndLinks(topicsLink, topicsName, idx + 1);
            }
        })
    }
}

function extractRepoHtml(html, topicName) {
    let selectorTool = cheerio.load(html);
    let repos = selectorTool("a.text-bold");
    for (let i = 0; i < repos.length && i < 8; i++) {
        let repoName = selectorTool(repos[i]).text().trim();
        let jsonFileName = repoName + ".json";
        fs.writeFile(path.join(dir, topicName, jsonFileName), "[]", function (err) {
            if (err) throw err;
            //console.log('File is created successfully.');
        });
        let repoLink = selectorTool(repos[i]).attr("href");
        createJsonObject(path.join(dir,topicName,jsonFileName),"https://github.com/" + repoLink+"/issues");
        //console.log(repoName, "https://github.com/" + repoLink);
    }
}

function createJsonObject(dirName,issuesLink){
    request(issuesLink, (err, response, html) => {
        if (err) {
            console.log("err");
        } else {
            let selectorTool = cheerio.load(html);
            let issues = selectorTool(`a[data-hovercard-type = "issue"]`);
            for(let i=0;i<issues.length;i++){
                let obj = {};
                obj.issueName = selectorTool(issues[i]).text()
                obj.issueLink = "https://github.com/"+selectorTool(issues[i]).attr("href");

                let usersjson = fs.readFileSync(dirName,"utf-8");
                let users = JSON.parse(usersjson);
                users.push(obj);
                usersjson = JSON.stringify(users);
                fs.writeFileSync(dirName,usersjson,"utf-8");
            }
        }
    })
}