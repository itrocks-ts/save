[![npm version](https://img.shields.io/npm/v/@itrocks/save?logo=npm)](https://www.npmjs.org/package/@itrocks/save)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/save)](https://www.npmjs.org/package/@itrocks/save)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/save?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/save)
[![issues](https://img.shields.io/github/issues/itrocks-ts/save)](https://github.com/itrocks-ts/save/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# save

Persist object data, processing input from HTML or JSON sources.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/save
```

`@itrocks/save` is designed to be used alongside other it.rocks building
blocks such as:

- [`@itrocks/action`](https://github.com/itrocks-ts/action)
- [`@itrocks/action-request`](https://github.com/itrocks-ts/action-request)
- [`@itrocks/data-to-object`](https://github.com/itrocks-ts/data-to-object)
- [`@itrocks/storage`](https://github.com/itrocks-ts/storage)
- [`@itrocks/auto-redirect`](https://github.com/itrocks-ts/auto-redirect)

It fits naturally inside a CRUD stack built with
[`@itrocks/crud-pack`](https://github.com/itrocks-ts/crud-pack).

## Usage

`@itrocks/save` provides a ready‑made backend action that

- receives data from an HTML form or JSON request,
- merges that data into a domain object,
- persists the object using the configured storage engine,
- and returns either an HTML confirmation page or a JSON payload.

You typically extend the generic `Save<T>` action with your own domain
type and HTTP route.

### Minimal example: save a `User` from a form

```ts
// src/domain/user.ts
export class User {
	id    = 0
	name  = ''
	email = ''
}

// src/actions/user/save-user.ts
import { Save }         from '@itrocks/save'
import { Route }        from '@itrocks/route'
import type { Request } from '@itrocks/action-request'

import { User }         from '../../domain/user.js'

@Route('/users/save')
export class SaveUser extends Save<User> {}

const saveUser = new SaveUser()

// Example of using the action in your HTTP layer
export async function saveUserHtml (request: Request<User>) {
	// The request already contains the form data for the user
	return saveUser.html(request)
}
```

With a route configuration that converts an incoming HTTP request to a
`Request<User>`, you can wire an HTML form directly to the `/users/save`
endpoint:

```html
<form action="/users/save" method="post">
	<input name="name"  type="text">
	<input name="email" type="email">
	<button type="submit">Save</button>
</form>
```

When the form is submitted, `SaveUser.html()` will

- build or load a `User` instance from the request,
- apply incoming form fields to that instance,
- persist it via the current storage backend,
- and render a small confirmation page that includes an
  auto‑redirect link back to the previous screen.

### Complete example: HTML and JSON endpoints

The same `Save<T>` action can expose both HTML and JSON persistence
endpoints. This is useful when you want a form‑based UI **and** a
programmatic API.

```ts
// src/actions/user/save-user.ts
import { Save }         from '@itrocks/save'
import { Route }        from '@itrocks/route'
import type { Request } from '@itrocks/action-request'

import { User }         from '../../domain/user.js'

@Route('/users/save')
export class SaveUser extends Save<User> {}

const saveUser = new SaveUser()

// HTML confirmation + auto‑redirect (uses the default save.html template)
export async function saveUserHtml (request: Request<User>) {
	return saveUser.html(request)
}

// JSON response with the saved object
export async function saveUserJson (request: Request<User>) {
	return saveUser.json(request)
}
```

Combined with other CRUD actions such as `@itrocks/new` and
`@itrocks/edit`, you get a standard flow:

1. Render a form (`New<User>` or `Edit<User>`).
2. Submit the form to a `Save<User>` endpoint.
3. Let `Save<User>` persist the object and return the appropriate
   response (HTML or JSON).

## API

### `class Save<T extends object = object> extends Action<T>`

The main exported symbol is the generic `Save<T>` class. It is a
concrete `Action<T>` implementation, pre‑wired to take incoming data,
apply it to an object of type `T`, and persist that object.

You typically create a subclass specific to your domain and route
configuration, for example `SaveUser extends Save<User>`.

#### Type parameter

- `T extends object` – the domain type you want to save (for example
  `User`, `Product`, `Order`, …).

`Save<T>` instantiates `T` when saving a new object and reuses the
existing instance when editing, based on the `Request<T>` it receives.

#### `html(request: Request<T>): Promise<HtmlResponse>`

Handle an HTML‑oriented save request.

**Parameters**

- `request` – a `Request<T>` describing the current action call. It is
  normally created by `@itrocks/action-request` from an incoming HTTP
  request and contains:
  - a reference to the target type `T`,
  - an existing object instance when editing,
  - the incoming data (typically form fields or query/body parameters).

**Behavior**

- If the request refers to an existing object, its properties are
  updated from the incoming data.
- If there is no existing object, a new instance of `T` is created and
  populated.
- The resulting object is persisted using the configured
  `@itrocks/storage` data source.
- An HTML response is returned. By default this uses the
  `save.html` template shipped with this package, which displays a
  simple notification such as `{@display} saved.` and an
  auto‑redirect link back to the previous route.

**Returns**

- A `Promise<HtmlResponse>` compatible with `@itrocks/core-responses`.

Use this method when your client expects an HTML confirmation page
after submitting a form.

#### `json(request: Request<T>): Promise<JsonResponse>`

Handle a JSON‑oriented save request.

**Parameters**

- `request` – a `Request<T>` with the same semantics as for `html()`,
  usually created from an HTTP request carrying JSON data.

**Behavior**

- The object of type `T` is created or loaded from the request.
- Incoming data is applied to the object.
- The object is persisted using the configured `@itrocks/storage`
  backend.
- A JSON response is returned containing the saved object.

**Returns**

- A `Promise<JsonResponse>` compatible with `@itrocks/core-responses`.

Use this method when you are building an API endpoint consumed by a
JavaScript frontend or other services.

## Typical use cases

- **CRUD save endpoint for HTML forms** – pair `Save<T>` with
  `@itrocks/new` and `@itrocks/edit` so that any object edited through
  a form is persisted consistently and confirmed with an HTML page.
- **JSON API for create / update** – expose `Save<T>.json()` as a
  REST‑style endpoint that accepts JSON payloads and returns the saved
  object, for use by single‑page applications or other services.
- **Shared library of domain actions** – define `Save<MyType>` actions
  in a reusable package that can be imported by multiple apps, relying
  on a consistent persistence and response pattern.
- **Standardized persistence behavior** – enforce the same
  validation/mapping/persistence pipeline for all your objects by
  routing every form or JSON update through `Save<T>` instead of
  duplicating save logic.
