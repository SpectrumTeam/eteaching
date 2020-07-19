'use strict'

const Database = use('Database');
const Admin = use('App/Models/Admin');
const User = use('App/Models/User');

class AuthController {
  async create({request, response, auth}) {
    try {
      const { email, password } = request.all();
      const user = await User.query().where('email', email).first();

      if (!user) {
        return response.status(404).json({error: 'Nenhum usuário encontrado'})
      }
      const admin = await Admin.query().where('user_id', user.id).first();
      if (!admin) {
        return response.status(404).json({error: 'Nenhum administrador encontrado'})
      }


      const token = await auth.withRefreshToken().attempt(email, password)
      await admin.merge({user, token});
      return response.status(200).json(admin)
    } catch (err) {
      console.log(err)
      return response.status(500).json({ error: 'Falha interna. Tente novamente' })
    }
  }

  async store({response, request}) {
    const trx = await Database.beginTransaction();
    try {
      const {email, password, name, last_name, cpf} = request.all();
      const user = await User.create({ email, password }, trx);

      await user.admin().create({
        user_id: user.id,
        name,
        last_name,
        cpf
      }, trx);

      await trx.commit()
      return response.status(200).json({success: 'Cadastrado com sucesso'})
    } catch (err) {
      console.log(err);
      await trx.rollback()
      return response.status(500).json({error: 'Falha interna. Tente novamente.'})
    }
  }
}

module.exports = AuthController
