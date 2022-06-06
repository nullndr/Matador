import { Anchor, Breadcrumbs, Group } from "@mantine/core";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { JobDataPanel } from "~/lib/matador/components/job-data";
import { JobInfoPanel } from "~/lib/matador/components/job-info";
import { JobResultPanel } from "~/lib/matador/components/job-result";
import { Link } from "~/lib/matador/helpers/ui-helpers";
import { getQueueJob, Job } from "~/lib/matador/index.server";

type LoaderData = {
  queueName: string;
  job: Job;
};

export const loader: LoaderFunction = async ({
  request,
  params,
}): Promise<LoaderData> => {
  if (!global.__redis) {
    throw new Response("Redis connection not found", {
      status: 503,
      statusText: "a redis connection has not been found",
    });
  }

  if (!params.queueName || !params.jobId) {
    throw new Response("Bad request", {
      status: 400,
      statusText: "The queue name or job id is missing",
    });
  }

  const queueName = decodeURI(params.queueName);
  const jobId = decodeURI(params.jobId);

  const job = await getQueueJob(queueName, jobId);

  if (!job) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  return { queueName, job };
};

export default function JobDetail() {
  const loaderData = useLoaderData<LoaderData>();
  if (!("timestamp" in loaderData.job)) {
    throw new Error();
  }

  const navigation = [
    {
      name: "Home",
      href: "/matador",
    },
    {
      name: "Queues",
      href: "/matador/queues",
    },
    {
      name: loaderData.queueName,
      href: `/matador/${loaderData.queueName}`,
    },
  ];

  if (loaderData.job.id && loaderData.job.id.includes("repeat")) {
    const idSplitted = loaderData.job.id.split(":");

    navigation.push({
      name: loaderData.job.name,
      href: `/matador/${loaderData.queueName}/repeat/${idSplitted[1]}`,
    });
  }

  navigation.push({
    name: loaderData.job.id!,
    href: "#",
  });

  return (
    <>
      <Group mb="md">
        <Breadcrumbs>
          {navigation.map((el, index) => (
            <Anchor key={index}>
              <Link to={el.href}>{el.name}</Link>
            </Anchor>
          ))}
        </Breadcrumbs>
      </Group>
      <JobInfoPanel
        id={loaderData.job.id ?? ""}
        jobName={loaderData.job.name ?? ""}
        queueName={loaderData.queueName}
        timestamp={new Date(Number(loaderData.job.timestamp))}
        attemptsMade={loaderData.job.attemptsMade}
        processedOn={
          loaderData.job.processedOn
            ? new Date(Number(loaderData.job.processedOn))
            : undefined
        }
        finishedOn={
          loaderData.job.finishedOn
            ? new Date(Number(loaderData.job.finishedOn))
            : undefined
        }
      />

      <JobDataPanel
        parent={loaderData.job.parent}
        data={loaderData.job.data}
        opts={loaderData.job.opts}
      />

      <JobResultPanel job={loaderData.job} />
    </>
  );
}
