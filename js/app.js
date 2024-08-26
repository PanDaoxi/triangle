// 请修改第 4、8、12、16、20 行的常量值，使其与您 LeanCloud “应用凭证” 中的内容相对应。
// Please modify the constant values in lines 4, 8, 12, 16 and 20 to correspond to the content of your LeanCloud 'App keys'.

const AppID = "DKnNEpKDX3ksG4AgUblwTsQv-gzGzoHsz";
// AppID 是该项目的唯一标识符。此 ID 不可变更。
// A unique and immutable project identifier.

const AppKey = "b9px38sstCWeqEGPxzTvLAk6";
// AppKey 是公开的访问密钥，适用于在公开的客户端中使用。使用 AppKey 进行的访问受到 ACL 的限制。
// A publicly accessible key exposed on the client side. Accessing data with the AppKey is restricted by ACL.

const REST_API = "https://dknnepkd.lc-cn-n1-shared.com";
// 客户端使用的 REST API 服务器地址。客户端的具体配置方法请参考指定客户端的服务器地址。
// A secret access key for trusted environments such as servers. Accessing data with the MasterKey bypasses all restrictions of ACL.

const Author = "PanDaoxi";
// 网页作者名称，显示在页面底部 `<footer>` 的版权信息中。
// The author name of the webpage is displayed in the copyright information of the `<footer>` at the bottom of the page.

const Website = "https://daoxi365.github.io/";
// 作者的网站，显示在页面底部 `<footer>` 的版权信息中。
// The author's website is displayed in the copyright information of the `<footer>` at the bottom of the page.

// 除非您知道修改后面的程序会发生什么，请勿进行操作，否则可能会带来无法预料的后果。
// Unless you know what will happen if you modify the program below, do not take any action as it may result in unforeseeable consequences.

// 初始化
AV.init({
	appId: AppID,
	appKey: AppKey,
	serverURL: REST_API,
});
AV.debug.enable();

// Markdown 渲染器自定义
marked.setOptions({
	gfm: true,
	tables: true,
	breaks: true,
	renderer: new marked.Renderer(),
});

// 格式化 Date 对象
function formatDate(date) {
	function padZero(num) {
		return num < 10 ? "0" + num : num;
	}

	var year = date.getFullYear();
	var month = padZero(date.getMonth() + 1);
	var day = padZero(date.getDate());
	var hours = padZero(date.getHours());
	var minutes = padZero(date.getMinutes());
	var seconds = padZero(date.getSeconds());

	return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
}

// 检索设置项并返回
async function searchForConfig(name) {
	try {
		const query = new AV.Query("Config");
		query.equalTo("name", name);
		const objs = await query.find();
		return objs[0].get("toOBJ");
	} catch (err) {
		return null;
	}
}

// 通过 objectID 获取 _File 类中的文件 URL
async function getURLViaOBJID(OBJID) {
	try {
		const query = new AV.Query("_File");
		const fileOBJ = await query.get(OBJID);
		return fileOBJ.get("url");
	} catch (err) {
		return null;
	}
}

// 生成 TOC
function generateTOC(markdown) {
	const html = marked(markdown);
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const headers = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

	var tocHTML = '<div class="md-toc-content">';
	headers.forEach((header) => {
		const level = header.tagName.toLowerCase();
		const text = header.textContent;
		const id = header.id || text.toLowerCase().replace(/\s+/g, "-");
		header.id = id;

		tocHTML += `<span class="md-toc-h${level[1]} md-toc-item">
						<a href="#${id}" class="md-toc-inner">${text}</a>
					</span>`;
	});
	tocHTML += "</div>";

	return tocHTML;
}

// 插入 TOC 到 Markdown 中
function insertTOCIntoMarkdown(markdown) {
	const toc = markdown.includes("[TOC]") ? generateTOC(markdown) : "";
	return markdown.replace("[TOC]", toc);
}

// 重构 Markdown 渲染器
function marked_(markdown) {
	var formulas = { block: [], inline: [] };

	// 提取公式
	markdown = markdown.replace(/(\$\$)([\s\S]*?)(\$\$)/g, (match, p1, p2) => {
		formulas.block.push(p2.trim());
		return `FORMULA_BLOCK_${formulas.block.length - 1}`;
	});
	markdown = markdown.replace(/(\$)([\s\S]*?)(\$)/g, (match, p1, p2) => {
		formulas.inline.push(p2.trim());
		return `FORMULA_INLINE_${formulas.inline.length - 1}`;
	});

	// 插入 TOC
	const tocInsertedMarkdown = insertTOCIntoMarkdown(markdown);

	var html = marked(tocInsertedMarkdown);
	let doc = document.createElement("div");
	doc.innerHTML = html;

	// 还原公式
	doc.innerHTML = doc.innerHTML.replace(/FORMULA_BLOCK_(\d+)/g, (match, index) => {
		return `\\[${formulas.block[index]}\\]`;
	});
	doc.innerHTML = doc.innerHTML.replace(/FORMULA_INLINE_(\d+)/g, (match, index) => {
		return `\\(${formulas.inline[index]}\\)`;
	});

	// 添加容器
	doc.querySelectorAll("pre").forEach((codeblock) => {
		const codeContainer = document.createElement("div");
		codeContainer.className = "code-container";
		codeblock.insertAdjacentElement("beforebegin", codeContainer);
		codeContainer.appendChild(codeblock);
	});

	// 添加容器
	doc.querySelectorAll("table").forEach((table) => {
		const tableContainer = document.createElement("div");
		tableContainer.className = "table-container";
		table.insertAdjacentElement("beforebegin", tableContainer);
		tableContainer.appendChild(table);
	});

	// console.warn(doc.innerHTML);
	return doc.innerHTML;
}

// MathJax 配置
function mathjaxStart() {
	if (window.MathJax) {
		MathJax.typesetPromise()
			.then(() => console.log("MathJax typesetting complete"))
			.catch((err) => console.error("MathJax typesetting error:", err));
	}
}

// 展示 “动态”，设置路由
async function showMessages(avatarURL, perPage) {
	// 展示 “动态”
	function output(template) {
		var std = document.createElement("div");
		std.innerHTML = template;
		document.getElementById("posts").appendChild(std);
	}

	// 生成 “动态” 摘要
	function getAbstract(post) {
		var lines = post.split("\n");
		if (lines.length > 3) {
			return lines.slice(0, 3).join("\n");
		} else {
			return post;
		}
	}

	// mdext 扩展指令
	function mdext() {
		// Highlight.js 高亮代码
		document.querySelectorAll("pre code").forEach((block) => {
			hljs.highlightBlock(block);
		});
		// MathJax 公式渲染
		mathjaxStart();
		// 调用 showValine 方法，展示 “动态” 评论区
		showValine();
		// 图片优化
		ImageScale();
	}

	// 从云端获取 “动态” 信息
	const msgsQuery = new AV.Query("Triangle");
	msgsQuery.equalTo("display", true);
	const msgs = await msgsQuery.find();
	var posts = [];
	if (!msgs.length) {
		// 特判：无 “动态”
		output(`<p>还没有 Triangle 动态。</p>`);
		return;
	}
	var posts = [];
	// 转化为 “动态” 列表数据
	msgs.forEach((e, i) => {
		posts.push({
			id: e.id,
			createdAt: formatDate(e.createdAt),
			updatedAt: formatDate(e.updatedAt),
			disableValine: e.get("disableValine"),
			content: marked_(e.get("content")),
			abstract: "",
			noUpdatedAt: false,
		});
		posts[i].noUpdatedAt = posts[i].createdAt === posts[i].updatedAt;
		posts[i].abstract = getAbstract(posts[i].content);
	});
	posts.reverse();
	window.posts = posts;

	// 首页摘要
	const PostList = {
		template: `
        <div v-mdext>
            <div class="one-post">
                <div class="post" v-for="post in paginatedPosts" :key="post.id">
                    <img class="avatar" :src="avatarURL" />
                    <div class="postContent">
                        <div v-html="post.abstract"></div>
                        <br /><router-link :to="'/post/' + post.id" class="expand-link">展开并阅读原文</router-link>
                        <p class="postTimestamp">
                            <span>创作于：<span>{{ post.createdAt }}</span></span>
                            <br v-if="!post.noUpdatedAt" />
                            <span v-if="!post.noUpdatedAt">修改于：<span>{{ post.updatedAt }}</span></span>
                        </p>
                    </div>
                </div>
            </div>
            <div class="pagination" v-if="totalPages > 1">
                <button @click="changePage(page - 1)" :disabled="page <= 1" class="btn btn-primary btn-lg">
                    <i class="faicon glyphicon glyphicon-chevron-left"></i> Previous
                </button>
                <span>Page {{ page }} of {{ totalPages }}</span>
                <button @click="changePage(page + 1)" :disabled="page >= totalPages" class="btn btn-primary btn-lg">
                    Next <i class="faicon glyphicon glyphicon-chevron-right"></i>
                </button>
            </div>
        </div>`,
		data() {
			return {
				posts: posts,
				page: 1,
				perPage: perPage,
				avatarURL: avatarURL,
			};
		},
		computed: {
			paginatedPosts() {
				const start = (this.page - 1) * this.perPage;
				const end = this.page * this.perPage;
				return this.posts.slice(start, end);
			},
			totalPages() {
				return Math.ceil(this.posts.length / this.perPage);
			},
		},
		methods: {
			changePage(newPage) {
				if (newPage > 0 && newPage <= this.totalPages) {
					this.page = newPage;
					sessionStorage.setItem("currentPage", newPage);
					this.$nextTick(() => mdext());
				}
			},
		},
		created() {
			const savedPage = sessionStorage.getItem("currentPage");
			const pageNumber = parseInt(savedPage, 10);

			if (!isNaN(pageNumber) && pageNumber > 0 && pageNumber <= this.totalPages) {
				this.page = pageNumber;
			} else {
				this.page = 1;
				sessionStorage.setItem("currentPage", 1);
			}
		},
	};

	// 单开路由展示全文
	const PostDetail = {
		template: `
					<div v-mdext>
						<span id="routepath" class="hidden">{{ $route.path }}</span>
						<div class="post gallery">
							<img class="avatar" :src="avatarURL" />
							<div class="postContent">
								<div v-html="post.content"></div>
									<p class="postTimestamp">
										<span>创作于：<span>{{ post.createdAt }}</span></span><br v-if="!post.noUpdatedAt" /><span v-if="!post.noUpdatedAt">修改于：<span>{{ post.updatedAt }}</span></span>
									</p>
								</div>
							</div>
							<div id="vcomments" v-if='$route.path != "/" && !post.disableValine'>
								<p>Triangle 提醒您：评论区没有加载完成，请您刷新一次。</p>
							</div>
							<div class="pagination">
								<!--<button class="simple-button" onclick="window.history.back()">-->
								<button class="btn btn-success btn-lg" onclick="window.history.back()">
									<i class="faicon glyphicon glyphicon-chevron-left"></i>
									Back
								</button>
							</div>
						</div>
					</div>`,
		data() {
			return {
				post: {},
				avatarURL: avatarURL,
			};
		},
		created() {
			const postId = this.$route.params.id;
			this.post = posts.find((item) => item.id === postId);
		},
	};

	// 单开路由展示全文
	const router = new VueRouter({
		routes: [
			{ path: "/", component: PostList },
			{ path: "/post/:id", component: PostDetail },
			{ path: "*", redirect: "/" },
		],
	});

	new Vue({
		el: "#postsApp",
		router,
		mounted() {
			this.applyMdext();
		},
		methods: {
			applyMdext() {
				this.$nextTick(() => {
					mdext();
				});
			},
		},
	});

	router.afterEach(() => {
		Vue.nextTick(() => {
			mdext();
		});
	});

	Vue.directive("mdext", {
		bind(el) {
			Vue.nextTick(() => {
				mdext();
			});
		},
	});
}

// 获取本地 JSON 文件
function fetchLocalJson(file) {
	return new Promise((resolve, reject) => {
		fetch(file)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				resolve(data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

// 评论区
function showValine() {
	try {
		fetchLocalJson("../media/json/emojiMaps.json").then((emojiMap) => {
			if (document.getElementById("vcomments") == null) return;
			var currentPath = document.getElementById("routepath").innerText;
			new Valine({
				el: "#vcomments",
				appId: AppID,
				appKey: AppKey,
				placeholder: "发表评论……",
				enableQQ: true,
				recordIP: true,
				avatar: "identicon",
				requiredFields: ["nick", "email"],
				emojiCDN: "https://i0.hdslb.com/bfs/emote/",
				emojiMaps: emojiMap,
				path: currentPath,
			});
			jinrishici.load(function (result) {
				var jrsc_plac = result.data.content + "\n\t——" + "【" + result.data.origin.dynasty + "】" + result.data.origin.author + "《" + result.data.origin.title + "》";
				document.getElementById("veditor").setAttribute("placeholder", jrsc_plac);
			});
			// 删除 vpower
			document.getElementsByClassName("vpower")[0].innerHTML = "";
			// 修改 vempty
			document.getElementsByClassName("vempty")[0].innerText = "还没有评论";
		});
		// console.warn(emojiMap);
	} catch (err) {
		console.warn(err);
	}
}

// 主函数 main
async function main() {
	// 获取各类配置
	var title = await searchForConfig("title");
	var subtitle = await searchForConfig("subtitle");
	var coverID = await searchForConfig("cover");
	var avatarID = await searchForConfig("avatar");
	var faviconID = await searchForConfig("favicon");
	var perPage = await searchForConfig("perPage");
	var codeStyle = await searchForConfig("codeStyle");
	var useRandomCoverImage = await searchForConfig("useRandomCoverImage");
	var avatarURL = await getURLViaOBJID(avatarID);
	var faviconURL = await getURLViaOBJID(faviconID);
	var coverURL;
	if (useRandomCoverImage == "true") coverURL = await searchForConfig("randomCoverImageAPI");
	else coverURL = await getURLViaOBJID(coverID);

	// 替换标题
	document.getElementById("title").innerText = document.title = title != null ? title : "Triangle";
	// 替换副标题
	document.getElementById("subtitle").innerText = subtitle != null ? subtitle : "Build your website using Triangle.";
	// 替换封面
	var _ = coverURL != null ? coverURL : "./media/img/default-cover.png";
	document.getElementById("cover").style.backgroundImage = `url("${_}")`;
	// 替换图标
	var link = document.querySelector("link[rel*='icon']") || document.createElement("link");
	link.type = "image/png";
	link.rel = "shortcut icon";
	link.href = faviconURL != null ? faviconURL : "./media/icon/default-favicon.ico";
	document.getElementsByTagName("head")[0].appendChild(link);
	// 替换 hljs 代码块样式
	fetchLocalJson("./media/json/codeStyles.json").then((codeStyles) => {
		// console.warn(codeStyles);
		var href;
		if (codeStyles.list && codeStyles.list.includes(codeStyle)) {
			href = `./js/highlightjs/styles/${codeStyle}.min.css`;
		} else {
			href = codeStyles.path + codeStyles.default + codeStyles.ext;
		}
		document.getElementById("codeStyle").setAttribute("href", href);
	});

	// 用户头像
	avatarURL = avatarURL != null ? avatarURL : "./media/img/default-avatar.jpg";

	// 调用 showMessages 方法，展示 “动态”
	await showMessages(avatarURL, perPage);

	// 页面挂件，美化效果
	(function () {
		// 加载中
		document.getElementById("write").classList.remove("hidden");
		document.getElementById("scrollToTopBtn").classList.remove("hidden");
		document.querySelector(".loader").classList.add("hidden");
		document.querySelector(".loader-holder").classList.add("hidden");
		// 版权
		var date = new Date();
		var f = document.createElement("footer");
		f.setAttribute("class", "copyright");
		f.innerHTML = `&copy; <span id="currentYear">${date.getFullYear()}</span> <a href="https://github.com/pandaoxi/triangle">Triangle WEB</a> - <a href="${Website}">${Author}</a>.`;
		document.getElementsByTagName("body")[0].appendChild(f);
		// 返回主站
		document.getElementById("mainsite").setAttribute("href", REST_API);
		// TOP 按钮
		document.getElementById("scrollToTopBtn").addEventListener("click", function (e) {
			e.preventDefault();
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		});
		// 代码高亮渲染
		// hljs.highlightAll();
	})();
}

// DOM 加载完成后，调用 main 函数
document.addEventListener("DOMContentLoaded", () => {
	try {
		main();
	} catch (err) {
		console.warn(err);
	}
});
