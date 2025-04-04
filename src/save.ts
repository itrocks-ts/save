import { Action }       from '@itrocks/action'
import { Request }      from '@itrocks/action-request'
import { dataToObject } from '@itrocks/data-to-object'
import { Route }        from '@itrocks/route'
import { dataSource }   from '@itrocks/storage'

@Route('/save')
export class Save<T extends object = object> extends Action<T>
{

	async html(request: Request<T>)
	{
		const object = (await request.getObject()) ?? new request.type
		await dataToObject(object, request.request.data)
		await dataSource().save(object)
		return this.htmlTemplateResponse(object, request, __dirname + '/save.html')
	}

	async json(request: Request<T>)
	{
		const object = (await request.getObject()) ?? new request.type
		await dataToObject(object, request.request.data)
		await dataSource().save(object)
		return this.jsonResponse(object)
	}

}
