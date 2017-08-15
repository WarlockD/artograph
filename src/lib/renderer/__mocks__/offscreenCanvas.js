const catchAll = new Proxy({} , {
  get: () => {
    return () => {};
  },
});

export const canvas = catchAll;
export const gl = catchAll;
