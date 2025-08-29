import gleam/dict.{type Dict}
import gleam/int
import gleam/list
import gleam/uri.{type Uri}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import modem
import posts.{type Post, posts as all_posts}

pub fn main() {
  let app = lustre.application(init:, update:, view:)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

fn init(_: a) -> #(Model, Effect(Msg)) {
  let route = case modem.initial_uri() {
    Ok(uri) -> parse_route(uri)
    Error(_) -> Index
  }

  let posts =
    all_posts
    |> list.map(fn(post) { #(post.id, post) })
    |> dict.from_list

  let model = Model(route:, posts:)
  let effect = modem.init(fn(uri) { UserNavigatedTo(parse_route(uri)) })

  #(model, effect)
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    UserNavigatedTo(route:) -> #(Model(..model, route:), effect.none())
  }
}

fn view(model: Model) -> Element(Msg) {
  html.div([], [
    html.header([], [
      html.h1([], [
        html.a([href(Index)], [html.text("<eltonsst>")]),
      ]),
    ]),
    html.nav([attribute.class("secondary-nav")], [
      html.ul([], [
        view_header_link(current: model.route, to: Posts, label: "Posts"),
      ]),
    ]),
    html.main([], {
      case model.route {
        Index -> view_index(model)
        Posts -> view_posts(model)
        PostById(post_id) -> view_post(model, post_id)
        NotFound(_) -> view_not_found()
      }
    }),
  ])
}

fn view_header_link(
  to target: Route,
  current current: Route,
  label text: String,
) {
  let is_active = case current, target {
    PostById(_), Posts -> True
    _, _ -> current == target
  }

  html.li([attribute.classes([#("active", is_active)])], [
    html.a([href(target)], [html.text(text)]),
  ])
}

fn view_index(model: Model) {
  let result_post = last_post(model.posts)
  [
    html.img([
      attribute.src("/priv/static/about.jpg"),
      attribute.alt("About me"),
      attribute.class("profile-image-content"),
    ]),
    title("Hello, Joe"),
    paragraph(
      "Or whoever you may be! This is were I will share random ramblings
       and thoughts about life.",
    ),
    html.p([], [
      html.text("There is not much going on at the moment, but you can still "),
      link(Posts, "read my ramblings ->"),
    ]),
    paragraph("And don't forget to read my last post <3"),
    case result_post {
      Ok(post) ->
        html.article([attribute.class("last-post")], [
          html.h3([], [
            html.a([href(PostById(post.id))], [
              html.text(post.title),
            ]),
          ]),
          html.p([], [html.text(post.summary)]),
        ])
      Error(_) -> html.div([], [])
    },
    view_footer(),
  ]
}

fn view_footer() {
  html.footer([], [
    html.div([attribute.class("social-links")], [
      html.a(
        [
          attribute.href("https://github.com/eltonsst"),
          attribute.target("_blank"),
          attribute.rel("noopener noreferrer"),
        ],
        [html.text("Github")],
      ),
      html.a(
        [
          attribute.href("https://linkedin.com/in/elton-stafa-bb802414a"),
          attribute.target("_blank"),
          attribute.rel("noopener noreferrer"),
        ],
        [html.text("LinkedIn")],
      ),
      html.a(
        [
          attribute.href("https://x.com/eltonsst"),
          attribute.target("_blank"),
          attribute.rel("noopener noreferrer"),
        ],
        [html.text("X")],
      ),
      html.a(
        [
          attribute.href("https://instagram.com/eltonsst"),
          attribute.target("_blank"),
          attribute.rel("noopener noreferrer"),
        ],
        [html.text("Instagram")],
      ),
    ]),
  ])
}

fn view_posts(model: Model) {
  let posts =
    model.posts
    |> dict.values
    |> list.sort(fn(a, b) { int.compare(a.id, b.id) })
    |> list.map(fn(post) {
      html.article([], [
        html.h3([], [
          html.a([href(PostById(post.id))], [
            html.text(post.title),
          ]),
        ]),
        html.p([], [html.text(post.summary)]),
      ])
    })

  [html.hr([]), title("Posts"), ..posts]
}

fn view_post(model: Model, post_id: Int) {
  case dict.get(model.posts, post_id) {
    Error(_) -> view_not_found()
    Ok(post) -> [
      html.hr([]),
      html.article([], [
        title(post.title),
        paragraph(post.summary),
        paragraph(post.text),
      ]),
      html.p([], [link(Posts, "<- Go back?")]),
    ]
  }
}

fn view_not_found() {
  [
    title("Not found"),
    paragraph(
      "You glimpse into the void and see -- nothing?
       Well that was somewhat expected.",
    ),
  ]
}

fn title(title: String) {
  html.h2([], [
    html.text(title),
  ])
}

fn paragraph(text: String) {
  html.p([], [html.text(text)])
}

fn link(target: Route, title: String) {
  html.a([href(target)], [html.text(title)])
}

fn href(route: Route) {
  let base_path = ""
  let url = case route {
    Index -> base_path <> "/"
    Posts -> base_path <> "/posts"
    PostById(post_id) -> base_path <> "/post/" <> int.to_string(post_id)
    NotFound(_) -> base_path <> "/404"
  }
  attribute.href(url)
}

fn parse_route(uri: Uri) {
  // Parse routes directly without base path since we're using custom domain
  let segments = uri.path_segments(uri.path)

  case segments {
    [] | [""] -> Index
    ["posts"] -> Posts
    ["post", post_id] ->
      case int.parse(post_id) {
        Ok(post_id) -> PostById(id: post_id)
        Error(_) -> NotFound(uri:)
      }
    _ -> NotFound(uri:)
  }
}

fn last_post(posts: Dict(Int, Post)) -> Result(Post, Nil) {
  case posts |> dict.keys |> list.max(int.compare) {
    Ok(max_key) -> dict.get(posts, max_key)
    Error(_) -> Error(Nil)
  }
}

type Route {
  Index
  Posts
  PostById(id: Int)
  NotFound(uri: Uri)
}

type Model {
  Model(posts: Dict(Int, Post), route: Route)
}

type Msg {
  UserNavigatedTo(route: Route)
}
