export type ModelWrapper<C, W> = {
    create: (args: { data: C }) => Promise<unknown>;
    upsert: (args: { where: W, create: C, update: C }) => Promise<unknown>;
    delete: (args: { where: W }) => Promise<unknown>;
}