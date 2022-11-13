import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import { Cascader, Input, Select, Space } from 'antd';
import { AudioOutlined } from '@ant-design/icons';
import './App.less';

const { Option } = Select;
const Main = () => {

  const selectBefore = (
    <Select defaultValue="https://" className="select-before">
      <Option value="http://">http://</Option>
      <Option value="https://">https://</Option>
    </Select>
  );
  
  const suffix = (
    <AudioOutlined
      style={{
        fontSize: 16,
        color: '#1890ff',
      }}
    />
  );

  return (
    <div id='main'>
      <Input addonBefore={selectBefore} addonAfter={suffix} defaultValue="mysite" />
     
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
