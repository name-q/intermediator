import { useState, memo, useCallback, useRef, useEffect } from 'react'
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
const crypto = require('crypto-js');

import {
  Input,
  Collapse,
  Button,
  Switch,
  Select,
  Popover,
  message,
} from 'antd';
import ReactJson from 'react-json-view';
import {
  SaveOutlined,
  ChromeOutlined,
  CompassOutlined,
  PlusOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

import './App.less';

const { Panel } = Collapse;
const { Option } = Select;

const Main = memo(() => {
  const [url, setUrl] = useState('')
  const [activeKey, setActiveKey]: [string[], Function] = useState([])
  const [rule, setRule] = useState([])
  const [status, setStatus] = useState(true)

  const inputEl: any = useRef(null);
  useEffect(() => {
    inputEl.current.focus()
    // 获取规则缓存文件信息
    window.electron.ipcRenderer.sendMessage("fs", ['getCache'])
    window.electron.ipcRenderer.once('fs', (arg) => {
      let cacheRule = formatData(arg)
      // eslint-disable-next-line no-console
      console.log(cacheRule, '<<<<INIT RULE');
      setRule(cacheRule)
      setUrl(cacheRule.length ? cacheRule[0].url : '')
      setActiveKey(cacheRule.length ? [cacheRule[0].indexes] : [])
    });
  }, [])

  const Suffix = (
    <>
      <ChromeOutlined
        style={
          {
            color: 'rgb(66, 210, 226)',
            fontSize: 20,
            padding: 5,
          }
        }
        onClick={() => handleIntermediator(rule, url)}
        rotate={33}
      />
    </>
  );

  return (
    <div id='main'>
      <Input
        ref={inputEl}
        style={{ color: 'red' }}
        addonAfter={Suffix}
        value={url}
        onChange={e => setUrl(e.target.value)}
        onPressEnter={useCallback(() => handleAddRule(url, setActiveKey, rule, setRule), [url])}
        placeholder="URL must contain 'http://' or 'https://' "
      />
      <div className='toolsBox'>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="primary"
            size='small'
            icon={<PlusOutlined />}
            onClick={() => handleAddRule(url, setActiveKey, rule, setRule)}
            disabled={!status}
          >
            Rule
          </Button>
          <Button
            type="primary"
            size='small'
            style={{ marginLeft: 10, height: 24 }}
            icon={<SaveOutlined />}
            onClick={() => handleSave(rule)}
            disabled={!status}
          />
        </div>
        <Switch
          checkedChildren="Enabled"
          unCheckedChildren="Disable"
          checked={status}
          onChange={e => setStatus(e)}
        />
      </div>

      {status && (
        <Collapse
          bordered={false}
          activeKey={activeKey}
          expandIcon={({ isActive }) => <CompassOutlined style={{ fontSize: 16, color: '#333' }} rotate={isActive ? 45 : -45} />}
          className="site-collapse-custom-collapse list-group"
          onChange={(key: string | string[]) => setActiveKey(key)}
        >
          {
            rule.map((ruleBox: ruleBox) => (
              <Panel
                header={
                  <>
                    <div className='header'>
                      <div className='url' onClick={() => setUrl(ruleBox.url)}>
                        {ruleBox.url}
                      </div>
                      <Switch
                        checkedChildren="on"
                        unCheckedChildren="off"
                        checked={ruleBox.onoff}
                        onClick={(checked, e) => {
                          e.stopPropagation()
                          handleRuleOnoff(ruleBox.indexes, setRule, rule, checked)
                        }}
                      />
                    </div>
                  </>
                }
                key={ruleBox.indexes}
                className="site-collapse-custom-panel"
              >
                {/* toolbar */}
                <div
                  className='toolbar'
                >
                  <Popover
                    placement='bottomLeft'
                    title="warning"
                    content={
                      <>
                        <p> delete the all rule under this URL ?</p>
                        <Button
                          size='small'
                          type='primary'
                          danger
                          onClick={() => handleDeleteRule(ruleBox.indexes, setRule, rule, setActiveKey)}
                        >
                          Delete
                        </Button>
                      </>
                    }
                    trigger="hover"
                  >
                    <DeleteOutlined style={{ marginLeft: -5 }} />
                  </Popover>
                  <PlusCircleOutlined style={{ marginRight: -4 }} onClick={() => handleAddRuleItem(ruleBox.indexes, setRule, rule)} />
                </div>
                {/* ruleItem */}
                {ruleBox.rule.map((item, index) => (
                  <div className='ruleBox' key={`ruleBox${index}`}>
                    <div className='ruleItemTools'>
                      <MinusCircleOutlined onClick={() => handleDeleteRuleItem(ruleBox.indexes, setRule, rule, index)} />
                      <Switch
                        size='small'
                        checkedChildren="on"
                        unCheckedChildren="off"
                        disabled={!ruleBox.onoff}
                        checked={item.onoff && ruleBox.onoff}
                        onClick={(checked, e) => {
                          e.stopPropagation()
                          handleRuleItemChange(ruleBox.indexes, setRule, rule, index, 'onoff', checked)
                        }}
                      />
                    </div>
                    <Input.Group compact >
                      <Input
                        style={{ width: '35%' }}
                        placeholder='remarks'
                        value={item.remarks}
                        onChange={e => {
                          handleRuleItemChange(ruleBox.indexes, setRule, rule, index, 'remarks', e.target.value)
                        }}
                      />
                      <Select
                        value={item.type}
                        style={{ width: '26%' }}
                        onChange={e => {
                          handleRuleItemChange(ruleBox.indexes, setRule, rule, index, 'type', e)
                        }}
                      >
                        <Option value="api">api</Option>
                        <Option value="regular">regular</Option>
                        <Option value="path">path</Option>
                      </Select>
                      <Input
                        style={{ width: '39.66666%' }}
                        value={item.change}
                        placeholder={
                          item.type === 'api'
                            ? 'eg: /get/user'
                            : item.type === 'regular'
                              ? 'eg: /user/'
                              : item.type === 'path'
                                ? 'eg: /Users/qy/'
                                : ''
                        }
                        onChange={e => {
                          handleRuleItemChange(ruleBox.indexes, setRule, rule, index, 'change', e.target.value)
                        }}
                      />
                    </Input.Group>

                    <Input.Group compact style={{ marginTop: 10, display: 'flex', alignItems: 'center' }}>
                      {item.type === 'api' && (
                        <Select
                          value={item.method}
                          style={{ width: '35%' }}
                          onChange={e => {
                            handleRuleItemChange(ruleBox.indexes, setRule, rule, index, 'method', e)
                          }}
                        >
                          <Option value="POST">POST</Option>
                          <Option value="GET">GET</Option>
                          <Option value="PUT">PUT</Option>
                          <Option value="DELETE">DELETE</Option>
                          <Option value="HEAD">HEAD</Option>
                          <Option value="OPTIONS">OPTIONS</Option>
                          <Option value="ALL">ALL</Option>
                        </Select>
                      )}
                      <Input.TextArea
                        style={{ flex: 1, height: 32 }}
                        value={item.value}
                        placeholder='Changed value'
                        onChange={e => {
                          handleRuleItemChange(ruleBox.indexes, setRule, rule, index, 'value', e.target.value)
                        }}
                      />
                    </Input.Group>

                    {!!ruleToJson(item.value) && (
                      <ReactJson
                        name={false}
                        collapsed
                        sortKeys
                        quotesOnKeys={false}
                        collapseStringsAfterLength={12}
                        src={ruleToJson(item.value)}
                        onEdit={e => {
                          handleJSONEditorChange(ruleBox.indexes, setRule, rule, index, e)
                        }}
                        onAdd={e => {
                          handleJSONEditorChange(ruleBox.indexes, setRule, rule, index, e)
                        }}
                        onDelete={e => {
                          handleJSONEditorChange(ruleBox.indexes, setRule, rule, index, e)
                        }}
                        displayDataTypes={false}
                      />
                    )}

                  </div>
                ))}
              </Panel>
            ))
          }
        </Collapse>
      )}
      <div className='footer'>:)</div>
    </div>
  );
})

/**
 * 标定缓存数据结构
 * 
 *  [{
 *    indexes:URLMD5,
 *    url:'https://github.com/name-q',
 *    onoff: *on* | off
 *    rule:[
 *      {
 *        type: api#匹配单个精准接口 | regular#正则匹配多个接口｜path匹配多个包含路径的接口,
 *        method?: POST | GET | PUT | DELETE | HEAD | OPTIONS ｜ *ALL* ｜ api单个接口规则时出现的选项
 *        change: /name-q/xxx | *name-q ｜ /name-q
 *        value: 改变后的值 或路径
 *        onoff: *on* | off
 *      },
 *    ]
 *  },...]
 * 
 * **/

type ruleItemKey = 'type' | 'method' | 'value' | 'change' | 'onoff' | 'remarks'
interface ruleItem {
  type: 'api' | 'regular' | 'path';
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'ALL';
  value: any;
  change: string;
  onoff: boolean;
  remarks: '';
}
interface ruleBox {
  indexes: string;
  url: string;
  rule: ruleItem[];
  onoff: boolean;
}

/**
 * 添加规则
 * url - 输入的网址
 * setActiveKey - 默认开启的块（仅新增规则使用 不做缓存）
 * rule - 现有的规则数据
 * setRule - 设置规则的方法
 *  */
const handleAddRule = (url: string, setActiveKey: Function, rule: ruleBox[], setRule: Function) => {
  try {
    if (!url) return message.info('URL not entered')
    // 是否为网址
    const reg = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    if (!reg.test(url)) return message.warning("URL must contain 'http://' or 'https://'");
    // 解析出标准网址
    const standardUrl = (urlx: string): any => {
      urlx = urlx.endsWith('/') ? urlx.substring(0, urlx.length - 1) : urlx
      return urlx.endsWith('/') ? standardUrl(urlx) : urlx
    }
    // 获取标准网址的MD5
    let urlMD5: string = getMD5(standardUrl(url.split('?')[0]))
    let existence = false
    if (rule.length) rule.map(i => { if (i.indexes === urlMD5) { existence = true } })
    // 如果此规则存在则置顶并打开
    if (existence) {
      let item: ruleBox = {
        indexes: urlMD5,
        url,
        rule: [{
          type: 'api',
          value: '',
          change: '',
          onoff: true,
          method: 'ALL',
          remarks: ''
        }],
        onoff: true
      }
      rule = rule.filter(i => { if (i.indexes === urlMD5) { item = i; return false } else { return true } })
      item.url = url
      rule.unshift(item)
    } else {
      // 如果此规则不存在则新增
      rule.unshift({
        indexes: urlMD5,
        url,
        rule: [{
          type: 'api',
          value: '',
          change: '',
          onoff: true,
          method: 'ALL',
          remarks: ''
        }],
        onoff: true
      })
    }
    // 载入缓存 并默认打开
    setRule(rule)
    setActiveKey([urlMD5])
  } catch (error: any) {
    message.error(error)
  }
}

const handleSave = (rule: ruleBox[]) => {
  window.electron.ipcRenderer.sendMessage("fs", ['setCache', rule])
  window.electron.ipcRenderer.once('fs', (arg) => {
    // console.log(arg)
  });
}

const getMD5 = (d: string) => {
  if (!d) throw 'getMd5() -- undefined';
  let d_ok = d.toString()
  return crypto.MD5(d_ok).toString()
}

// {0:{a:1},1:{b:2}}   Format Data -->  [{a:1},{b:2}]
const formatData = (object: any) => {
  let arr: any = []
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      let item: ruleBox = object[key]
      // @ts-ignore
      item.rule = item.rule.map(i => JSON.parse(i))
      arr.push(item)
    }
  }
  return arr
}

const handleAddRuleItem = (indexes: string, setRule: Function, rule: ruleBox[]) => {
  rule.map(i => {
    if (i.indexes === indexes) {
      i.rule.unshift({
        type: 'api',
        value: '',
        change: '',
        onoff: true,
        method: 'ALL',
        remarks: ''
      })
    }
  })
  setRule([...rule])
}

const handleDeleteRuleItem = (indexes: string, setRule: Function, rule: ruleBox[], index: number) => {
  rule.map(i => {
    if (i.indexes === indexes) {
      i.rule = i.rule.filter((item, itemIndex) => itemIndex !== index)
    }
  })
  rule = rule.filter(i => i.rule.length)
  setRule([...rule])
}

const handleDeleteRule = (indexes: string, setRule: Function, rule: ruleBox[], setActiveKey: Function) => {
  rule = rule.filter(i => i.indexes !== indexes)
  setRule([...rule])
  setActiveKey(rule.length ? [rule[0].indexes] : [])
}

const handleRuleOnoff = (indexes: string, setRule: Function, rule: ruleBox[], checked: boolean) => {
  rule.map(i => {
    if (i.indexes === indexes) {
      i.onoff = checked
    }
  })
  setRule([...rule])
}

const handleRuleItemChange = (indexes: string, setRule: Function, rule: ruleBox[], index: number, key: ruleItemKey, value: string | boolean) => {
  rule.map(i => {
    if (i.indexes === indexes) {
      i.rule.map((item: ruleItem, itemIndex) => {
        if (itemIndex === index) {
          // @ts-ignore
          item[key] = value
        }
      })
    }
  })
  setRule([...rule])
}

const ruleToJson = (value: any) => {
  try {
    value = JSON.parse(value)
    if (value && Object.prototype.toString.call(value) === '[object Object]') {
      return value
    } else {
      return false
    }
  } catch {
    return false
  }
}

const handleJSONEditorChange = (indexes: string, setRule: Function, rule: ruleBox[], index: number, { updated_src }: any) => {
  let value = updated_src ? JSON.stringify(updated_src) : ''
  rule.map(i => {
    if (i.indexes === indexes) {
      i.rule.map((item: ruleItem, itemIndex) => {
        if (itemIndex === index) {
          // @ts-ignore
          item['value'] = value
        }
      })
    }
  })
  setRule([...rule])
}

// 打开内部浏览器并应用规则
const handleIntermediator = (rule: ruleBox[], url: string) => {
  if (!url) return message.info('URL not entered')
  // 是否为网址
  const reg = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
  if (!reg.test(url)) return message.warning("URL must contain 'http://' or 'https://'");
  // 解析出标准网址
  const standardUrl = (urlx: string): any => {
    urlx = urlx.endsWith('/') ? urlx.substring(0, urlx.length - 1) : urlx
    return urlx.endsWith('/') ? standardUrl(urlx) : urlx
  }
  // 获取标准网址的MD5
  let urlMD5: string = getMD5(standardUrl(url.split('?')[0]))
  // 过滤出属于这个网址的规则
  rule = rule.filter(i => i.indexes === urlMD5)

  window.electron.ipcRenderer.sendMessage("intermediator", [rule, url])
  window.electron.ipcRenderer.once('intermediator', (arg: any) => {
    message.success(arg)
  });
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
