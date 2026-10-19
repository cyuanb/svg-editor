# SVG Editor CLI

一个基于 **TypeScript + 面向对象** 实现的命令行 SVG 矢量图形编辑器，通过 REPL 交互式创建、编辑、组织矢量图形，并支持标准 SVG 文件的读写与浏览器直接预览。

## 功能特性

- **REPL 交互**：`svg>` 提示符逐行执行命令，`#` 注释，双引号支持带空格参数
- **六种内置图形**：`rect` / `circle` / `ellipse` / `line` / `text` / `g`
- **层级组合**：`g` 容器可任意嵌套；`in` 子句在创建时直接指定父容器，`group` / `ungroup` / `addto` 事后调整结构
- **完整撤销重做**：一条编辑命令 = 一个 undo 单元；容器操作递归作用于全部子孙
- **SVG 文件读写**：`read` 读入外部 SVG 文件（缺失 id 自动补全并警告），`save` 输出标准 SVG，可直接用浏览器打开预览

## 环境要求

| 依赖 | 版本 |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |

## 安装

```bash
npm install
```

## 使用

```bash
npm run cli
```

启动后进入交互式编辑器：

```text
svg-editor 0.1 — type 'help' for commands

svg> init 400 200
canvas 400x200 created
svg> create rect start 30 70 120 60 #4a90d9
rect#start created
svg> create line edge 150 100 250 100 black
line#edge created
svg> create rect end 250 70 120 60 #f5a623
rect#end created
svg> tree
svg (400x200)
├── rect#start  x=30 y=70 w=120 h=60 fill=#4a90d9
├── line#edge   (150,100) -> (250,100)
└── rect#end    x=250 y=70 w=120 h=60 fill=#f5a623
svg> save demo.svg
saved to demo.svg (3 elements)
```

保存的 `demo.svg` 可直接拖入浏览器查看渲染效果。

## 命令说明

| 类别 | 命令 | 说明 |
|---|---|---|
| 文档 | `init [w] [h]` | 新建画布，默认 800×600 |
| | `read <file.svg>` | 读入 SVG 文件为当前文档 |
| | `save [file.svg]` | 保存；无参数时存回 read 时的路径 |
| | `canvas [w] [h]` | 查看 / 修改画布尺寸 |
| 编辑 | `create <type> <id> [params…] [in <gid>]` | 创建图形，可选直接挂入容器 |
| | `delete <id>` | 删除图形（容器连同全部子孙） |
| | `move <id> <dx> <dy>` | 平移；容器整体递归平移 |
| | `scale <id> <factor>` | 等比缩放；位置与尺寸同乘 |
| | `set <id> <attr> <value>` | 设置白名单属性 / 文本内容 |
| | `group <newGid> <id…>` | 新建容器并收编已有图形 |
| | `ungroup <gid>` | 解散容器，子图形提升到父级 |
| | `addto <gid> <id>` | 把图形移入容器作为末子 |
| | `front <id>` / `back <id>` | 调整同级 z-order |
| 显示 | `tree [id]` | 结构树（属性内联显示） |
| | `show <id>` | 单个图形属性明细 |
| | `help` | 显示全部命令与语法 |
| 历史 | `undo` / `redo` | 撤销 / 重做；新编辑清空 redo 栈 |

各图形类型的 `create` 参数：

```
create rect    <id> <x> <y> <w> <h> [fill]
create circle  <id> <cx> <cy> <r> [fill]
create ellipse <id> <cx> <cy> <rx> <ry> [fill]
create line    <id> <x1> <y1> <x2> <y2> [stroke]
create text    <id> <x> <y> "content"
create g       <id>
```

## 项目结构

```
svg-editor/
├── doc/README.md          # 架构文档
├── src/
│   ├── app/               # 组装根与 REPL 入口
│   ├── cli/               # REPL 循环、命令分发
│   ├── commands/          # 编辑命令（一类一命令）
│   ├── core/              # Shape 层次 + SvgDocument（领域模型）
│   ├── factory/           # 图形工厂
│   ├── history/           # undo/redo 管理
│   ├── io/                # SVG 读写
│   ├── parsing/           # 引号感知 tokenizer 与命令解析
│   └── errors/            # 统一错误类型
└── tests/                 # 单元测试 + 集成测试
```

## 架构设计

- **Command 模式**：每条编辑命令封装为独立对象，自带 `execute` / `undo`，redo 通过重放实现
- **Composite 模式**：`GroupShape` 与叶子图形统一响应 `move` / `scale` / `delete`，容器操作递归传播
- **Factory 模式**：`ShapeFactory` 集中管理类型名 → 类的映射，便于后续扩展新图形类型
- **依赖方向**：`core` 不依赖任何模块；`io → core`；`commands → core + factory`；`cli → 全部`

完整架构方案见 [doc/README.md](doc/README.md)。

## 开发

```bash
npm test              # 运行全部测试
npm run typecheck     # TypeScript 严格类型检查
```
