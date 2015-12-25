# jsterm

jsterm 是一个用 Javascript 编写的命令行模拟器，最初的版本由 [clarkduvall.com](http://clarkduvall.com) 实现。GitHub 地址是：https://github.com/clarkduvall/jsterm

## 新的内容

jsterm 1.0 实现了一个 JSON 文件系统，并在上面编写了 `cat`、`cs`、`ls`、`gimp`、`tree` 等命令以及一系列的命令行快捷键。而新的 jsterm 2.0 中，新增了如下内容：

1. 增加全屏显示 API，并修改快捷键 `Ctrl+C`，使其能够从全屏模式中返回命令行模式；
2. 增加命令行快捷键 `Ctrl+U`，在命令行中用于删除用户当前输入；
3. 增加新的 Shell 命令 `whoami`、`pwd`、`fortune`、`date`、`cal`、`echo`、`history` 等；
4. 新增黑客帝国矩阵 `matrix`；
5. 新增命令行待办事项程序 `todo`，数据本地保存；
6. 新增 Google 搜索，使用 `google adele` 可检索关于 Adele 的网页；
7. 新增 Vim 编辑器，可打开并编辑一个文本文件（编辑器使用 CodeMirror 实现）；
