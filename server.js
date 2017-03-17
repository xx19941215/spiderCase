//http://www.cnblogs.com/coco1s/p/4954063.html

'use strict';

let http = require('http'),
    url = require('url'),
    superagent = require('superagent'),
    cheerio = require('cheerio'),
    async = require('async'),
    eventproxy = require('eventproxy');

//eventproxy(https://github.com/JacksonTian/eventproxy ) 非常轻量的工具，但是能够带来一种事件式编程的思维变化。
//用 js 写过异步的同学应该都知道，如果你要并发异步获取两三个地址的数据，并且要在获取到数据之后，对这些数据一起进行利用的话，常规的写法是自己维护一个计数器。
//先定义一个 var count = 0，然后每次抓取成功以后，就 count++。如果你是要抓取三个源的数据，由于你根本不知道这些异步操作到底谁先完成，那么每次当抓取成功的时候，就判断一下count === 3。当值为真时，使用另一个函数继续完成操作。
//而 eventproxy 就起到了这个计数器的作用，它来帮你管理到底这些异步操作是否完成，完成之后，它会自动调用你提供的处理函数，并将抓取到的数据当参数传过来。
let ep = new eventproxy(),
    urlsArray = [],
    pageUrls = [],
    pageNum = 200;

for( let i = 0; i<=200; i++) {
    pageUrls.push('http://www.cnblogs.com/#p' + i);
}

function start() {
    function onRequest(req, res) {
        res.writeHead(200, 'Content-Type: text/plain');
        pageUrls.forEach(function (pageUrl) {
            //superagent(http://visionmedia.github.io/superagent/ ) 是个轻量的的 http 方面的库，是nodejs里一个非常方便的客户端请求代理模块，当我们需要进行 get 、 post 、 head 等网络请求时，尝试下它吧。
            superagent.get(pageUrl)
                .end(function (err, pres) {

                    // pres.text 里面存储着请求返回的 html 内容，将它传给 cheerio.load 之后
                    // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
                    // 剩下就都是利用$ 使用 jquery 的语法了
                    let $ = cheerio.load(pres.text);
                    let curPageUrls = $('.titlelnk');

                    for(let i = 0; i<curPageUrls.length; i++) {
                        let articleUrl = curPageUrls.eq(i).attr('href');
                        urlsArray.push(articleUrl);

                        //相当于一个计数器
                        ep.emit('BlogArticleHtml', articleUrl);
                    }
                });

            ep.after('BlogArticleHtml', pageUrls.length*20, function (articleUrls) {
                res.write('<br/>');
                res.write('articleUrls length is' + articleUrls.length + '<br/>');
                for (let i = 0; i<articleUrls.length; i++) {
                    res.write('articleUrls is ' + articleUrls[i] + '<br/>');
                }

                res.end();
            });
        });

    }

    http.createServer(onRequest).listen(3000);
}



exports.start = start;