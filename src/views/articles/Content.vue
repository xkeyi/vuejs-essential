<template>
  <div class="col-md-9 left-col pull-right">
    <div class="panel article-body content-body">
      <h1 class="text-center">{{ title }}</h1>
      <div class="article-meta text-center">
        <i class="fa fa-clock-o"></i>
        <abbr>{{ date | moment('from') }}</abbr>
      </div>
      <div class="entry-content">
        <div class="content-body entry-content panel-body ">
          <div class="markdown-body" v-html="content"></div>

          <div v-if="auth && uid === 1" class="panel-footer operate">
            <div class="actions">
              <a @click="deleteArticle" class="admin" href="javascript:;"><i class="fa fa-trash-o"></i></a>
              <a @click="editArticle" class="admin" href="javascript:;"><i class="fa fa-pencil-square-o"></i></a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 点赞 -->
    <div class="votes-container panel panel-default padding-md">
      <div class="panel-body vote-box text-center">
        <div class="btn-group">
          <a @click="like" href="javascript:;" class="vote btn btn-primary popover-with-html" :class="likeClass">
            <i class="fa fa-thumbs-up"></i> {{ likeClass ? '已赞' : '点赞' }}
          </a>
          <div class="or"></div>
          <button @click="showQrcode = true" class="btn btn-success"><i class="fa fa-heart"></i> 打赏</button>
        </div>
        <div class="voted-users">
          <div class="user-lists">
            <span v-for="likeUser in likeUsers">
              <!-- 点赞用户是当前用户时，加上类 animated 和 swing 以显示一个特别的动画  -->
              <img :src="user && user.avatar" class="img-thumbnail avatar avatar-middle" :class="{ 'animated swing' : likeUser.uid === 1 }">
            </span>
          </div>
          <div v-if="!likeUsers.length" class="vote-hint">成为第一个点赞的人吧 ?</div>
        </div>
      </div>
    </div>

    <!-- 打赏弹窗 -->
    <Modal :show.sync="showQrcode" class="text-center">
      <!-- 这块内容有 title 命名，会插入 <slot name="title"></slot> 所在的位置并将其替换  -->
      <div v-if="user" slot="title">
        <img :src="user.avatar" class="img-thumbnail avatar" width="48">
      </div>

      <!-- 这块内容没有命名，会插入没命名的默认 <slot></slot> 所在的位置并将其替换 ，如果没有默认 <slot>，这块内容将被舍弃  -->
      <div>
        <p class="text-md">如果你想学习更多前端的知识，VuejsCaff.com 是个不错的开始</p>
        <div class="payment-qrcode inline-block">
          <h5>扫一扫打开 VuejsCaff.com</h5>
          <p>
            <qrcode-vue value="https://vuejscaff.com/" :size="160"></qrcode-vue>
          </p>
        </div>
      </div>

      <!-- 这块内容有 footer 命名，会插入 <slot name="footer"></slot> 所在的位置并将其替换  -->
      <div slot="footer">
        <div class="text-center">祝你学习愉快 :)</div>
      </div>
    </Modal>
  </div>
</template>

<script>
import SimpleMDE from 'simplemde'
import hljs from 'highlight.js'
import emoji from 'node-emoji'
import { mapState } from 'vuex' // 引入 mapState 辅助函数
import QrcodeVue from 'qrcode.vue' // 引入 qrcode.vue 的默认值

export default {
  name: 'Content',
  components: {
    QrcodeVue
  },
  data() {
    return {
      title: '', // 文章标题
      content: '', // 文章内容
      date: '', // 创建时间
      uid: 1, // 用户ID
      likeUsers: [], // 点赞用户列表
      likeClass: '', // 点赞样式
      showQrcode: false, // 是否显示打赏弹窗
    }
  },
  // 添加计算属性
  computed: {
    // 将仓库的以下状态混入到计算属性之中
    ...mapState([
      'auth',
      'user'
    ])
  },
  created() {
    // 从当前路由对象获取参数 articleId
    const articleId = this.$route.params.articleId
    // 从 getArticleById 返回指定 ID 的文章
    const article = this.$store.getters.getArticleById(articleId)

    if (article) {
      let { uid, title, content, date, likeUsers } = article

      this.uid = uid
      this.title = title

      // 先使用 emojify 方法解析 emoji 字符串标识，name => name 表示不认识的就返回原值
      content = emoji.emojify(content, name => name)
      // 再使用编辑器的 markdown 方法将 Markdown 内容转成 HTML
      this.content = SimpleMDE.prototype.markdown(content)

      this.date = date

      // 更新实例的 likeUsers
      this.likeUsers = likeUsers || []
      // 更新 likeClass，点赞用户列表包含当前用户时，赋值为 active，表示已赞
      this.likeClass = this.likeUsers.some(likeUser => likeUser.uid === 1) ? 'active' : ''

      this.$nextTick(() => {
        // 遍历当前实例下的 'pre code' 元素
        this.$el.querySelectorAll('pre code').forEach((el) => {
          // 使用 highlight.js 的 highlightBlock 方法进行高亮
          hljs.highlightBlock(el)
        })
      })

      // 设置实例的 articleId
      this.articleId = articleId
    }
  },
  methods: {
    // 编辑文章
    editArticle() {
      // 点击编辑文章图标，跳到编辑文章页面，并附带当前文章 ID
      this.$router.push({ name: 'Edit', params: { articleId: this.articleId } })
    },
    // 删除文章
    deleteArticle() {
      this.$swal({
        text: '你确定要删除此内容么？',
        confirmButtonText: '删除'
      }).then((res) => {
        if (res.value) {
          this.$store.dispatch('post', { articleId: this.articleId })
        }
      })
    },
    like(e) {
      // 未登录时，提示登录
      if (!this.auth) {
        this.$swal({
          text: '需要登录以后才能执行此操作。',
          confirmButtonText: '前往登录'
        }).then((res) => {
          if (res.value) {
            this.$router.push('/auth/login')
          }
        })
      } else {
        const target = e.currentTarget
        // 点赞按钮是否含有 active 类，我们用它来判断是否已赞
        const active = target.classList.contains('active')
        const articleId = this.articleId

        if (active) {
          // 清除已赞样式
          this.likeClass = ''
          /**
           * 调用 store.dispatch 默认返回一个 Promise 对象，表示一个异步操作的最终状态及其返回的值，因此我们可以在 .then 的回调函数里获取 likeUsers
           */
          // 分发 like 事件取消赞，更新实例的 likeUsers 为返回的值
          this.$store.dispatch('like', { articleId }).then((likeUsers) => {
            this.likeUsers = likeUsers
          })
        } else {
          // 添加已赞样式
          this.likeClass = 'active animated rubberBand'
          /**
           * 调用 store.dispatch 默认返回一个 Promise 对象，表示一个异步操作的最终状态及其返回的值，因此我们可以在 .then 的回调函数里获取 likeUsers
           */
          // 分发 like 事件，传入 isAdd 参数点赞，更新实例的 likeUsers 为返回的值
          this.$store.dispatch('like', { articleId, isAdd: true }).then((likeUsers) => {
            this.likeUsers = likeUsers
          })
        }
      }
    }
  }
}
</script>

<style scoped>

</style>
