import { fakerFA } from '@faker-js/faker';

import { TransactionType } from '@prisma/client';

import { prisma } from '../src/lib/prisma';

// create 50 fake data
for (let i = 0; i < 50; i++) {
  await prisma.transaction.create({
    data: {
      amount:
        fakerFA.number.int({
          min: 1000,
          max: 1000000,
        }) * 50,
      date: fakerFA.date.past(),
      party: fakerFA.person.fullName(),
      type: (['DEPOSIT', 'WITHDRAW'] satisfies TransactionType[])[Math.floor(Math.random() * 2)],
      description: fakerFA.lorem.sentences({
        min: 1,
        max: 5,
      }),
    },
  });
}
