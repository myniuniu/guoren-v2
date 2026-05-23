#!/bin/bash
# 请假流程审批 Demo - 启动脚本
# 使用前请确保已安装: Java 17+
# Maven 会自动下载到 /tmp

echo "======================================"
echo "  请假流程审批 Demo - Flowable 7.2.0"
echo "======================================"
echo "

# 检查 Java
if ! command -v java &> /dev/null; then
    echo "错误: 未检测到 Java，请安装 Java 17+"
    exit 1
fi
echo "✓ Java: $(java -version 2>&1 | head -1)"

# 自动下载 Maven（如果没有）
MVN_PATH=$(command -v mvn 2>/dev/null)
if [ -z "$MVN_PATH" ]; then
    if [ ! -f /tmp/apache-maven-3.9.6/bin/mvn ]; then
        echo "正在下载 Maven 3.9.6..."
        curl -sL https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.tar.gz -o /tmp/apache-maven-3.9.6-bin.tar.gz
        cd /tmp && tar xzf apache-maven-3.9.6-bin.tar.gz
        echo "✓ Maven 已下载"
    fi
    MVN_PATH=/tmp/apache-maven-3.9.6/bin/mvn
fi
echo "✓ Maven: $MVN_PATH"

echo ""
echo "正在编译后端项目..."
cd "$(dirname "$0")"

$MVN_PATH compile -q
if [ $? -ne 0 ]; then
    echo "编译失败，请检查代码"
    exit 1
fi
echo "✓ 编译成功"

# 启动
echo ""
echo "正在启动后端服务 (端口: 8080)..."
echo "前端请访问: http://localhost:5173"
echo ""
$MVN_PATH spring-boot:run
