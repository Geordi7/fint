
import * as quill from '../quill';

// quote: s => `"${s.replaceAll('"','""')}"`,
// conditional: (cases, otherwise) => cases.length === 0 ? otherwise : 
//     `(CASE ${
//         cases.map(({predicate, result}) => `WHEN ${predicate} THEN ${result}`).join(' ')
//     } ELSE ${otherwise})
//     END`,

const Q = quill.quill({
    exec: async q => q,
    render: q => {
        console.log('QUERY:', JSON.stringify(q, null, '  '));
        return {
            rendered: 'query!',
            params: q.query
        };
    },
    embed: rs => {
        const s = quill.defaultEmbedding(rs);
        console.log('SCHEMA:', JSON.stringify(s, null, '  '));
        return s;
    },
}, {
    types: {
        employee: {inhabits: 'Employees', dt: 'int'},
        Department: {inhabits: 'Departments', dt: 'int'},
        budget: {inhabits: 'Budgets', dt: 'int'},
        email: {dt: 'text'},
    },
    relations: {
        Employees: {
            id: 'id',
            fields: {
                id: 'employee',
                email: 'email',
                hired_on: 'date',
                reports_to: 'employee',
                inactive: 'bool',
            },
        },
        EmployeeNames: {
            id: ['employee', 'lang'],
            fields: {
                employee: 'employee',
                lang: 'lang',
                name: 'text',
            },
        },
        Departments: {
            id: 'dept',
            fields: {
                dept: 'Department',
                name: 'text',
                head: 'employee',
            },
        },
        Roles: {
            id: 'id',
            fields: {
                id: 'role',
                name: 'text',
                description: 'text',
                owner: 'employee',
            },
        },
        EmployeeRoles: {
            id: ['employee','role'],
            fields: {
                employee: 'employee',
                role: 'role',
                assigned_by: 'employee',
            },
        },
        Budgets: {
            id: 'budget',
            fields: {
                owner: 'employee',
            }
        }
    },
});

//const employee_names_and_emails =
Q(() => null, ({s}) => {
    const emp = s.Employees();
    const {name: name_en} = s.EmployeeNames(emp, {lang: 'en'});
    const {name: name_el} = s.EmployeeNames(emp, {lang: 'el'});

    return {
        Number: emp.id,
        'Name (English)': name_en,
        'Name (Greek)': name_el,
        Email: emp.email
    };
    // {Name: {source: 'Employees', instance: 0, field: 'name_en'}, Email: {}}
});

`
SELECT
    *
FROM
    Roles T1,
    Employees T2,
    Employees T3,
    EmployeeRoles T4
WHERE
    T4.role = T1.role
    AND T4.employee = T2.id
    AND T3.id = T4.owner
    AND T3.id = ?
`
const role_owner_report = Q(() => null, ({s, ops: {param, join}}) => {
    const role = s.Roles();
    const employee = s.Employees();
    const owner = s.Employees(role.owner, {id: param.int('roleOwner')});
    
    s.EmployeeRoles(role, employee);

    return {
        Owner: owner.email,
        Role: join(' ', role.name, role.description),
        Employee: employee.email,
    };
});

role_owner_report.exec({roleOwner: 45});

// Q(() => null, (s,ops) => {
//     const {where, is, any, sum} = ops;

//     const customer = s.customers();
//     const item = s.items();
//     const invoice = s.Invoices(customer, {cancelled: 'N'});
//     const {quantity, value} = s.InvoiceLines(item, invoice);

//     where(
//         is(invoice.date).inRange('2024-01-01', '2025-01-01'),
//         any(
//             is(sum(quantity)).greaterThan(1000),
//             is(sum(value)).greaterThan(10000),
//         ),
//     );

//     return {[All]: {
//         customer,
//         item,
//         quantity: sum(quantity),
//         value: sum(value),
//     }};
// });

