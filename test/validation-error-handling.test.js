'use strict'

const t = require('tap')
const Fastify = require('..')
const test = t.test

const schema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  }
}

test('should work with valid payload', t => {
  t.plan(3)

  const fastify = Fastify()

  fastify.post('/', { schema }, function (req, reply) {
    reply.code(200).send(req.body.name)
  })

  fastify.inject({
    method: 'POST',
    payload: {
      name: 'michelangelo'
    },
    url: '/'
  }, (err, res) => {
    t.error(err)
    t.deepEqual(res.payload, 'michelangelo')
    t.strictEqual(res.statusCode, 200)
  })
})

test('should fail immediately with invalid payload', t => {
  t.plan(3)

  const fastify = Fastify()

  fastify.post('/', { schema }, function (req, reply) {
    reply.code(200).send(req.body.name)
  })

  fastify.inject({
    method: 'POST',
    payload: {
      hello: 'michelangelo'
    },
    url: '/'
  }, (err, res) => {
    t.error(err)
    t.deepEqual(JSON.parse(res.payload), {
      statusCode: 400,
      error: 'Bad Request',
      message: "body should have required property 'name'"
    })
    t.strictEqual(res.statusCode, 400)
  })
})

test('should be able to use setErrorHandler specify custom validation error', t => {
  t.plan(3)

  const fastify = Fastify()

  fastify.post('/', { schema }, function (req, reply) {
    reply.code(200).send(req.body.name)
  })

  fastify.setErrorHandler(function (error, request, reply) {
    if (error.validation) {
      reply.status(422).send(new Error('validation failed'))
    }
  })

  fastify.inject({
    method: 'POST',
    payload: {
      hello: 'michelangelo'
    },
    url: '/'
  }, (err, res) => {
    t.error(err)
    t.deepEqual(JSON.parse(res.payload), {
      statusCode: 422,
      error: 'Unprocessable Entity',
      message: 'validation failed'
    })
    t.strictEqual(res.statusCode, 422)
  })
})

test('should be able to override wrapValidationError', t => {
  t.plan(3)

  const fastify = Fastify()

  const wrapValidationError = function (result, dataVar) {
    return { [dataVar]: result }
  }

  fastify.post('/', { schema, wrapValidationError }, function (req, reply) {
    reply.code(200).send(req.body.name)
  })

  fastify.inject({
    method: 'POST',
    payload: {
      hello: 'michelangelo'
    },
    url: '/'
  }, (err, res) => {
    t.error(err)
    t.deepEqual(JSON.parse(res.payload), {
      body: [
        {
          dataPath: '',
          keyword: 'required',
          message: "should have required property 'name'",
          params: {
            missingProperty: 'name'
          },
          schemaPath: '#/required'
        }
      ]
    })
    t.strictEqual(res.statusCode, 400)
  })
})