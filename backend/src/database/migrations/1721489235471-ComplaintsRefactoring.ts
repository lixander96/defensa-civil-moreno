import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class ComplaintsRefactoring1721489235471 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Renombrar la columna 'first_name' a 'full_name'
    await queryRunner.addColumn(
      'complaint',
      new TableColumn({ name: 'full_name', type: 'varchar', default: "''" }),
    );

    // Concatenar los valores de 'first_name' y 'last_name' en 'full_name'
    await queryRunner.query(`
      UPDATE complaint
      SET full_name = TRIM(CONCAT(first_name, ' ', last_name))
    `);

    // Eliminar la columna 'last_name'
    await queryRunner.dropColumns('complaint', ['first_name', 'last_name']);

    // Agregar la nueva columna 'manager_id'
    await queryRunner.addColumn(
      'complaint',
      new TableColumn({
        name: 'manager_id',
        type: 'int',
        isNullable: true,
      }),
    );

    // Crear la relación con la entidad 'User'
    await queryRunner.createForeignKey(
      'complaint',
      new TableForeignKey({
        columnNames: ['manager_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    // Update incident_type_id in complaint_incident_types_incident_type

    await queryRunner.addColumn(
      'complaint_incident_types_incident_type',
      new TableColumn({
        name: 'aux',
        type: 'int',
        isNullable: false,
        default: 24,
      }),
    );

    await queryRunner.query(`
    UPDATE complaint_incident_types_incident_type
    SET aux = CASE
        WHEN incident_type_id = 1 THEN 1
        WHEN incident_type_id = 2 THEN 3
        WHEN incident_type_id = 3 THEN 28
        WHEN incident_type_id = 4 THEN 80
        WHEN incident_type_id = 5 THEN 61
        WHEN incident_type_id = 6 THEN 71
        WHEN incident_type_id = 7 THEN 73
        WHEN incident_type_id = 8 THEN 72
        WHEN incident_type_id = 9 THEN 12
        WHEN incident_type_id = 10 THEN 8
        WHEN incident_type_id = 11 THEN 77
        WHEN incident_type_id = 12 THEN 81
        WHEN incident_type_id = 13 THEN 20
        WHEN incident_type_id = 14 THEN 34
        WHEN incident_type_id = 15 THEN 18
        WHEN incident_type_id = 16 THEN 47
        WHEN incident_type_id = 17 THEN 84
        ELSE incident_type_id
    END
`);

    await queryRunner.query(`
              UPDATE complaint_incident_types_incident_type
              SET incident_type_id = CASE
                  WHEN incident_type_id = 1 THEN 1
                  WHEN incident_type_id = 2 THEN 19
                  WHEN incident_type_id = 3 THEN 28
                  WHEN incident_type_id = 4 THEN 80
                  WHEN incident_type_id = 5 THEN 61
                  WHEN incident_type_id = 6 THEN 71
                  WHEN incident_type_id = 7 THEN 73
                  WHEN incident_type_id = 8 THEN 72
                  WHEN incident_type_id = 9 THEN 22
                  WHEN incident_type_id = 10 THEN 21
                  WHEN incident_type_id = 11 THEN 77
                  WHEN incident_type_id = 12 THEN 81
                  WHEN incident_type_id = 13 THEN 20
                  WHEN incident_type_id = 14 THEN 34
                  WHEN incident_type_id = 15 THEN 18
                  WHEN incident_type_id = 16 THEN 47
                  WHEN incident_type_id = 17 THEN 84
                  ELSE incident_type_id
              END
          `);

    await queryRunner.query(`
      UPDATE complaint_incident_types_incident_type
      SET incident_type_id = aux
  `);

    await queryRunner.dropColumn(
      'complaint_incident_types_incident_type',
      'aux',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la relación con la entidad 'User'
    const table = await queryRunner.getTable('complaint');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('manager_id') !== -1,
    );
    await queryRunner.dropForeignKey('complaint', foreignKey);

    // Eliminar la columna 'manager_id'
    await queryRunner.dropColumn('complaint', 'manager_id');

    // Eliminar la columna 'files'
    await queryRunner.dropColumn('complaint', 'files');

    // Restaurar la columna 'last_name'
    await queryRunner.addColumn(
      'complaint',
      new TableColumn({
        name: 'last_name',
        type: 'varchar',
      }),
    );

    // Restaurar los valores de 'first_name' y 'last_name' a partir de 'full_name'
    await queryRunner.query(`
      UPDATE complaint
      SET last_name = SUBSTRING_INDEX(full_name, ' ', -1),
          first_name = SUBSTRING_INDEX(full_name, ' ', LENGTH(full_name) - LENGTH(REPLACE(full_name, ' ', '')))
    `);

    // Renombrar la columna 'full_name' a 'first_name'
    await queryRunner.renameColumn('complaint', 'full_name', 'first_name');
  }
}
