
(async () => {
    const { promises: Fs } = require('fs')

    const mockttp = require('mockttp');
    let rulex = JSON.parse(decodeURIComponent(process.argv[2]))[0]

    // create https proxy
    const https = await mockttp.generateCACertificate();
    const server = mockttp.getLocal({ https });

    if (rulex.onoff) {
        let { rule } = rulex
        if (rule.length) {
            // load rules
            rule.map(async item => {
                let { onoff, type, method, change, value } = item
                if (onoff && change) {
                    if (['api'].includes(type)) {
                        if (['POST', 'ALL'].includes(method)) {
                            await server
                                .forPost(change)
                                .always()
                                .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        }
                        if (['GET', 'ALL'].includes(method)) {
                            await server
                                .forGet(change)
                                .always()
                                .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        }
                        if (['PUT', 'ALL'].includes(method)) {
                            await server
                                .forPut(change)
                                .always()
                                .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        }
                        if (['DELETE', 'ALL'].includes(method)) {
                            await server
                                .forDelete(change)
                                .always()
                                .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        }
                        if (['HEAD', 'ALL'].includes(method)) {
                            await server
                                .forHead(change)
                                .always()
                                .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        }
                        if (['OPTIONS', 'ALL'].includes(method)) {
                            await server
                                .forOptions(change)
                                .always()
                                .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        }
                        // 这种方式不可取 会将页面丢失 ::根目录/也是GET::
                        // ALL定义为上述所有请求的规则载入与type === 'regular'一致
                        // if (['ALL'].includes(method)) {
                        //     await server
                        //         .forAnyRequest(change)
                        //         .always()
                        //         .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        // }
                    }
                    if (['regular'].includes(type)) {
                        let reg = '/'
                        try {
                            reg = new RegExp(change)
                        } catch {
                            return
                        }
                        await server
                            .forPost(reg)
                            .always()
                            .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        await server
                            .forGet(reg)
                            .always()
                            .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        await server
                            .forPut(reg)
                            .always()
                            .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        await server
                            .forDelete(reg)
                            .always()
                            .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        await server
                            .forHead(reg)
                            .always()
                            .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                        await server
                            .forOptions(reg)
                            .always()
                            .thenReply(200, value, { "content-type": "application/json; charset=UTF-8" })
                    }
                    if (['path'].includes(type)) {
                        let valuex = false
                        try {
                            // value必须是目录
                            valuex = await Fs.stat(value)
                            valuex = valuex.isDirectory()
                        } catch {
                            return
                        }
                        if (change && valuex) {
                            server.forGet(new RegExp(change))
                                .thenCallback(async (req) => {
                                    let { path } = req
                                    // 获取文件名(带后缀)
                                    const fileName = path.substring(path.lastIndexOf('/') + 1).split('?')[0].toLocaleLowerCase()
                                    // 获取后缀
                                    let suffix = fileName.split('.')[fileName.split('.').length - 1].toLocaleLowerCase()
                                    // 获取文件buffer
                                    let rawBody = 'cannot find file'
                                    try {
                                        value = value.endsWith('/') ? value : `${value}/`
                                        rawBody = await Fs.readFile(`${value}${fileName}`)
                                    } catch {
                                        return {
                                            statusCode: 404,
                                            rawBody
                                        }
                                    }
                                    // 根据后缀反推Content-Type
                                    // 浏览器根据Content-Type优化预览时的展示 
                                    // 怎么说呢type类型太多了没必要加全 把常用的搞出来吧
                                    let headers
                                    let enumContentType = {
                                        js: 'application/javascript',
                                        css: 'text/css',

                                        woff2: 'font/woff2',
                                        html: 'text/html',
                                        xhtml: 'text/html',
                                        jsp: 'text/html',
                                        txt: 'text/plain',
                                        xml: 'text/xml',

                                        gif: 'image/gif',
                                        jpeg: 'image/jpeg',
                                        jpg: 'image/jpeg',
                                        png: 'image/png',
                                        pdf: 'application/pdf'
                                    }
                                    
                                    if (enumContentType[suffix]) headers = {
                                        "Content-Type": ['image', 'font'].includes(enumContentType[suffix])
                                            ? enumContentType[suffix] : `${enumContentType[suffix]}; charset=UTF-8`
                                    }

                                    if (headers) return {
                                        statusCode: 200,
                                        headers,
                                        rawBody
                                    }

                                    return {
                                        statusCode: 200,
                                        rawBody
                                    }
                                })
                        }
                    }
                }
            })
        }
    }
    //  Thanks, Tim Perry 
    await server.forUnmatchedRequest().always().thenPassThrough()

    // open proxy
    await server.start();

    const caFingerprint = mockttp.generateSPKIFingerprint(https.cert);

    console.log(`${server.port}>>>${caFingerprint}`);
})();