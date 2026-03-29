// scripts/analyze-props.ts
import { Project } from 'ts-morph';
import path from 'path';

// 1. 初始化项目
const project = new Project();

// 2. 获取组件文件的绝对路径
const componentPath = path.resolve(process.cwd(), 'components/TranslationHistory.tsx');

// 3. 加载源文件
const sourceFile = project.addSourceFileAtPath(componentPath);

// 4. 找到 HistoryProps 接口
const historyInterface = sourceFile.getInterface('HistoryProps');

if (historyInterface) {
  console.log('--- 📋 TranslationHistory Props 提取结果 ---');
  
  historyInterface.getProperties().forEach(prop => {
    const name = prop.getName();
    const type = prop.getType().getText();
    const isOptional = prop.hasQuestionToken() ? '是' : '否';
    
    // 提取 JSDoc 注释（如果有的话）
    const docs = prop.getJsDocs().map(doc => doc.getComment()).join(' ');

    console.log(`🔹 属性: ${name}`);
    console.log(`   类型: ${type}`);
    console.log(`   可选: ${isOptional}`);
    console.log(`   描述: ${docs || '暂无描述'}`);
    console.log('---------------------------');
  });
} else {
  console.error('❌ 找不到名为 HistoryProps 的接口，请检查组件定义。');
}