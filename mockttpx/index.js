(async () => {
    const mockttp = require('mockttp');
    console.log(JSON.parse(process.argv[2]), '<<<<')
    let rulex = JSON.parse(process.argv[2])[0]

    // create https proxy
    const https = await mockttp.generateCACertificate();
    const server = mockttp.getLocal({ https });

    if (rulex.onoff) {
        let { rule } = rulex
        if (rule.length) {
            // load rules
            rule.map(async item => {
                let { onoff, type, method, change, value } = item
                if (onoff) {
                    if (type === 'api') {
                        if (['POST', 'ALL'].includes(method)) {
                            await server
                                .forPost(change)
                                .always()
                                .thenReply(200, value)
                        }
                        if (['GET', 'ALL'].includes(method)) {
                            await server
                                .forGet(change)
                                .always()
                                .thenReply(200, value)
                        }
                        if (['PUT', 'ALL'].includes(method)) {
                            await server
                                .forPut(change)
                                .always()
                                .thenReply(200, value)
                        }
                        if (['DELETE', 'ALL'].includes(method)) {
                            await server
                                .forDelete(change)
                                .always()
                                .thenReply(200, value)
                        }
                        if (['HEAD', 'ALL'].includes(method)) {
                            await server
                                .forHead(change)
                                .always()
                                .thenReply(200, value)
                        }
                        if (['OPTIONS', 'ALL'].includes(method)) {
                            await server
                                .forOptions(change)
                                .always()
                                .thenReply(200, value)
                        }
                        // 这种方式不可取 会将页面丢失 ::根目录/也是GET::
                        // ALL定义为上述所有请求的规则载入
                        // if (['ALL'].includes(method)) {
                        //     await server
                        //         .forAnyRequest(change)
                        //         .always()
                        //         .thenReply(200, value)
                        // }
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