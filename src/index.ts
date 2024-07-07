import fs from "node:fs";
import axios from "axios";
import chalk from "chalk";

const RANGE_STRING = "abcdefghijklmnopqrstuvwxyz";
const RANGE_NUM = "0123456789";

class CheckUser {
  wantUserNameLength: number;
  rangeString: string;
  endString: string;
  checkedSet: Set<any>;
  totalSize: number;
  constructor(len: number, hasNum: boolean = true, endString: string = "") {
    if (typeof len !== "number" || len <= 0) {
      throw new Error("用户名长度必须是正整数");
    }
    this.wantUserNameLength = len;
    this.rangeString = hasNum ? RANGE_STRING + RANGE_NUM : RANGE_STRING;
    this.endString = endString;
    this.checkedSet = new Set();
    this.totalSize = (hasNum ? 36 : 26) ** len; // 动态计算TOTAL_SIZE
  }
  // 假设构造函数和其他方法已经实现
  async run() {
    // 使用 Promise.all 来并发处理请求，提高效率
    while (this.checkedSet.size < this.totalSize) {
      let username = this.generateRandomUsername();

      if (this.checkedSet.has(username)) {
        continue;
      }

      this.checkedSet.add(username);

      // 封装检查用户名的逻辑为一个单独的异步函数，提高代码的可读性和可维护性
      await this.checkUsername(username);
    }

    console.log(chalk.bgCyan("所有可能的用户名都已检查"));
  }

  // 新增方法，用于将结果写入文件
  writeToFile(username: string, status: number, isRegistered: boolean) {
    const result = `${username} - ${
      isRegistered ? "已注册" : "未注册"
    } - 状态码 "${status}"\n`;
    fs.appendFile("results.txt", result, (err) => {
      if (err) {
        console.error(chalk.red("写入文件时出错:", err));
      }
    });
  }

  // 将检查用户名的逻辑提取到一个单独的异步函数中
  async checkUsername(username: string) {
    try {
      const response = await axios.head(`https://github.com/${username}`);

      // 增加对 response 的存在性检查
      if (response && response.status === 200) {
        console.log(
          chalk.redBright(
            `用户名 "${username}" - 已注册 - 状态码 "${response.status}"`
          )
        );
        this.writeToFile(username, response.status, true);
      }
    } catch (error: any) {
      // 增加对 error.response 的存在性检查
      if (error.response && error.response.status === 404) {
        console.log(
          chalk.cyanBright(
            `用户名 "${username}" - 未注册 - 状态码 "${error.response.status}"`
          )
        );
        this.writeToFile(username, error.response.status, false);
      } else if (error.response) {
        console.log(
          chalk.red(
            `请求发生意外错误: ${error.message}, 状态码: ${error.response.status}`
          )
        );
      } else {
        console.error(`请求失败: ${error.message}`);
      }
    }

    // 使用更灵活的节流策略代替固定的延迟
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 1000 + 500)
    );
  }

  generateRandomUsername() {
    let username = "";
    for (let i = 0; i < this.wantUserNameLength; i++) {
      username +=
        this.rangeString[Math.floor(Math.random() * this.rangeString.length)];
    }
    return username + this.endString;
  }
}

export default CheckUser;
