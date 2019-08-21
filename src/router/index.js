import Vue from 'vue'
import Router from 'vue-router'
// 引入 ./routes.js 的默认值
import routes from './routes'

Vue.use(Router)

// 这里删除了原来的 routes 常量

const router = new Router({
  mode: 'history',
  linkExactActiveClass: 'active', // 其默认值是 'router-link-exact-active'，我们这里改为 'active' 以利用 Bootstrap 的激活样式
  // 指定滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      // 有锚点时，滚动到锚点
      return { selector: to.hash }
    } else if (savedPosition) {
      // 有保存位置时，滚动到保存位置
      return savedPosition
    } else {
      // 默认滚动到页面顶部
      return { x: 0, y: 0 }
    }
  },
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

  // 当前用户
  const user = store.state.user && store.state.user.name
  // 路由参数中的用户
  const paramUser = to.params.user

  app.$message.hide()

  if (
    (auth && to.path.indexOf('/auth/') !== -1) || // 用户已经登录切要去的路由中包含auth(登录注册)时
    (!auth && to.meta.auth) || // 需要登录而用户没有登录时
    (articleId && !store.getters.getArticleById(articleId)) ||  // 有 articleId 且不能找到与其对应的文章时，跳转到首页
    (paramUser && paramUser !== user && !store.getters.getArticlesByUid(null, paramUser).length) // 路由参数中的用户不为当前用户，且找不到与其对应的文章时，跳转到首页
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
