import { Grid, GridCol, Paper, Skeleton, Stack } from "@mantine/core";

export function LoadingSkeleton() { return <Stack><Grid>{[1,2,3,4].map((item) => <GridCol key={item} span={{ base: 12, sm: 6, lg: 3 }}><Paper p="md" className="tabler-card"><Skeleton height={14} width="60%" /><Skeleton height={30} mt="md" width="40%" /></Paper></GridCol>)}</Grid><Skeleton height={320} /></Stack>; }
