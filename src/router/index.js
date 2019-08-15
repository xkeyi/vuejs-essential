import Vue from 'vue'
import Router from 'vue-router'
// 引入 ./routes.js 的默认值
import routes from './routes'

Vue.use(Router)

// 这里删除了原来的 routes 常量

const router = new Router({
  mode: 'history',
  linkExactActiveClass: 'active', // 其默认值是 'router-link-exact-active'，我们这里改为 'active' 以利用 Bootstrap 的激活样式
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const app = router.app
  const store = app.$options.store
  // 获取仓库里的登录信息
  const auth = store.state.auth
  // 或者
  // import store from '../store'
  // const auth = store.state.auth

  // 获取目标页面路由参数里的 articleId
  const articleId = to.params.articleId

  app.$message.hide()

  if (
    (auth && to.path.indexOf('/auth/') !== -1) || // 用户已经登录切要去的路由中包含auth(登录注册)时
    (!auth && to.meta.auth) || // 需要登录而用户没有登录时
    (articleId && !store.getters.getArticleById(articleId)) // 有 articleId 且不能找到与其对应的文章时，跳转到首页
    ) {
    // 如果当前用户已登录，且目标路由包含 /auth/ ，就跳转到首页
    next('/')
  } else {
    next()
  }
})

// 注册全局后置钩子
router.afterEach((to, from) => {
  const app = router.app
  const store = app.$options.store
  // 获取目标页面路由参数里的 showMsg
  const showMsg = to.params.showMsg

  if (showMsg) {
    // showMsg 是一个字符时，使用它作为消息内容
    if (typeof showMsg === 'string') {
      app.$message.show(showMsg)
    } else {
      app.$message.show('操作成功')
    }
  }
})

export default router
